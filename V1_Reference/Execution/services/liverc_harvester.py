"""A.P.E.X. Execution Layer - LiveRC Harvester
Scrapes race results from LiveRC.com to provide telemetry to the Setup Advisor.
"""

import logging
import re
from typing import Any, Optional

import pandas as pd
import requests
from bs4 import BeautifulSoup

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex.liverc_harvester")

class LiveRCHarvester:
    """Handles scraping of LiveRC result pages."""

    def __init__(self, url: str):
        self.url = url
        self.driver_data = []
        self.race_info = {}

    def fetch_results(self) -> bool:
        """Fetches and parses the main race result table."""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(self.url, headers=headers, timeout=10)
            if response.status_code != 200:
                logger.error(f"Failed to fetch {self.url}: Status {response.status_code}")
                return False

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find the main results table
            # LiveRC tables usually have class 'results_table' or similar
            table = soup.find('table', {'class': 'race_results'}) or soup.find('table')
            if not table:
                logger.error("No results table found on page.")
                return False

            rows = table.find_all('tr')
            if not rows:
                logger.error("No rows found in table.")
                return False

            # Identify the driver name column index and other metrics
            # LiveRC usually has 'Driver' in the second or third column
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if not cols: continue

                # Filter out header rows or spacer rows
                text_content = [c.text.strip() for c in cols]
                if "Driver" in text_content:
                    continue # Skip header

                if len(cols) < 5: continue

                # Driver name is usually inside an <a> tag near the 'View Laps' or in the same cell
                # Based on the previous run, the first <a> might be 'View Laps'
                driver_name = ""
                all_links = row.find_all('a')
                for link in all_links:
                    link_text = link.text.strip()
                    if link_text and "View Laps" not in link_text and "Driver Profile" not in link_text:
                        driver_name = link_text
                        break

                if not driver_name:
                    driver_name = cols[1].text.replace("View Laps", "").strip()

                # Cleanup Driver Name (Remove starting numbers like '1\n' or trailing IDs)
                driver_name = re.sub(r'^\d+\s*|^\d+\n', '', driver_name).strip()
                driver_name = re.sub(r'\s+\d+$', '', driver_name).strip()

                # Consistency often has its own class or specific text pattern
                consistency = ""
                for c in cols:
                    if "%" in c.text:
                        consistency = c.text.strip()

                processed = {
                    "Pos": cols[0].text.strip(),
                    "Driver": driver_name,
                    "Laps/Time": cols[2].text.strip() if len(cols) > 2 else "",
                    "Fastest": cols[3].text.strip() if len(cols) > 3 else "",
                    "Avg": cols[4].text.strip() if len(cols) > 4 else "",
                    "Consistency": consistency
                }

                if processed["Driver"] and processed["Driver"] != "Driver":
                    self.driver_data.append(processed)

            logger.info(f"Successfully harvested {len(self.driver_data)} drivers from {self.url}")
            return True

        except Exception as e:
            logger.error(f"Error during harvest: {str(e)}")
            return False

    def get_driver_telemetry(self, racer_name: str) -> Optional[dict[str, Any]]:
        """Returns specific telemetry for a racer name (partial match)."""
        for driver in self.driver_data:
            if racer_name.lower() in driver['Driver'].lower():
                return driver
        return None

    def get_event_entries(self, event_id: str, racer_name: str) -> list[dict[str, Any]]:
        """Parses ?p=view_entry_list&id=EVENT_ID to find classes the racer is in.
        Returns a list of classes.
        """
        # Example URL: https://track.liverc.com/results/?p=view_entry_list&id=490470
        base_url = self.url.split("/results/")[0] + "/results/"
        entry_url = f"{base_url}?p=view_entry_list&id={event_id}"

        try:
            res = requests.get(entry_url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            classes = []

            # Entry lists are usually split by class headers
            class_sections = soup.find_all('div', class_='class_results_header')
            for section in class_sections:
                class_name = section.text.strip()
                # Find the table immediately following this header
                table = section.find_next('table')
                if table and racer_name.lower() in table.text.lower():
                    classes.append({"class": class_name, "event_id": event_id})

            return classes
        except Exception as e:
            logger.error(f"Error fetching entry list: {e}")
            return []

    def get_lap_times(self, driver_name: str) -> Optional[list[float]]:
        """Extract individual lap times for a driver from the current result page.
        Requires the page to have JavaScript embedded lap data (racerLaps array).

        Args:
            driver_name: Name of driver to extract laps for

        Returns:
            List of lap times in seconds, or None if not found

        """
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(self.url, headers=headers, timeout=10)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch laps for {driver_name}: HTTP {response.status_code}")
                return None

            # Look for racerLaps JavaScript array in the page
            # Pattern: racerLaps[DRIVER_ID] = { driverName: '...', laps: [{...}, {...}] }
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all script tags (lap data is embedded in JS)
            scripts = soup.find_all('script')
            lap_times = []

            for script in scripts:
                if script.string and 'racerLaps' in script.string:
                    # Extract lap times from JavaScript
                    script_content = script.string

                    # Look for lap time patterns: 'time' : '58.245'
                    lap_pattern = r"'time'\s*:\s*'(\d+\.\d+)'"
                    matches = re.findall(lap_pattern, script_content)

                    if matches:
                        lap_times = [float(t) for t in matches]
                        logger.info(f"Extracted {len(lap_times)} lap times for {driver_name}")
                        return lap_times

            if not lap_times:
                logger.warning(f"No lap data found in JavaScript for {driver_name}")
                return None

        except Exception as e:
            logger.error(f"Error extracting lap times for {driver_name}: {str(e)}")
            return None

    def scan_heat_sheets(self, racer_name: str, classes: list[str] | None = None) -> list[dict[str, Any]]:
        """Scans the main results index for active heat sheets and finds racer heats.
        Optionally filters by a list of classes.
        """
        if classes is None:
            classes = []
        try:
            res = requests.get(self.url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            upcoming = []

            # Find links to heat sheets e.g. ?p=view_heat_sheet&id=9910741
            links = soup.find_all('a', href=re.compile(r'p=view_heat_sheet'))
            for link in links:
                # Check if this heat sheet matches any of our classes if provided
                sheet_text = link.parent.text.lower()
                if classes:
                    match_class = any(c.lower() in sheet_text for c in classes)
                    if not match_class: continue

                sheet_url = self.url.split("/results/")[0] + "/results/" + link['href']
                sheet_res = requests.get(sheet_url, timeout=10)
                sheet_soup = BeautifulSoup(sheet_res.text, 'html.parser')

                # Check if racer is in this sheet
                if racer_name.lower() in sheet_soup.text.lower():
                    # Find the specific race status
                    races = sheet_soup.find_all('div', class_='race_info')
                    for race in races:
                        # Check if racer is in this specific race block
                        if racer_name.lower() in race.parent.text.lower():
                            status = race.find('span', class_='race_status')
                            status_text = status.text.strip() if status else "Unknown"
                            race_num = race.find('span', class_='race_number').text.strip() if race.find('span', class_='race_number') else "N/A"

                            # Extract class name from the sheet or parent if needed
                            upcoming.append({
                                "Race": race_num,
                                "Status": status_text,
                                "URL": sheet_url
                            })
            return upcoming
        except Exception as e:
            logger.error(f"Error scanning heat sheets: {e}")
            return []

def test_harvest():
    url = "https://hnmc.liverc.com/results/?p=view_race_result&id=6391444"
    harvester = LiveRCHarvester(url)
    if harvester.fetch_results():
        print(pd.DataFrame(harvester.driver_data).head())
        # Example lookup
        driver = harvester.get_driver_telemetry("Driver") # Replace with real name in test
        if driver: print(f"Found: {driver}")

if __name__ == "__main__":
    test_harvest()
