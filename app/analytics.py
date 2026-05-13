"""Analytics and click tracking"""
from datetime import datetime
from typing import List, Dict, Any
import json
import os

# Simple file-based storage for clicks (can be replaced with DB)
CLICKS_LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'clicks.jsonl')


class ClickTracker:
    """Track and store user clicks"""

    @staticmethod
    def log_click(from_screen: str, to_screen: str, timestamp: str = None) -> Dict[str, Any]:
        """Log a click from one screen to another"""
        if not timestamp:
            timestamp = datetime.now().isoformat()

        click_data = {
            "from": from_screen,
            "to": to_screen,
            "timestamp": timestamp,
            "path": f"{from_screen} -> {to_screen}",
        }

        # Save to file
        try:
            with open(CLICKS_LOG_FILE, 'a') as f:
                f.write(json.dumps(click_data, ensure_ascii=False) + '\n')
        except Exception as e:
            print(f"Error logging click: {e}")

        return click_data

    @staticmethod
    def get_all_clicks() -> List[Dict[str, Any]]:
        """Get all logged clicks"""
        clicks = []
        try:
            if os.path.exists(CLICKS_LOG_FILE):
                with open(CLICKS_LOG_FILE, 'r') as f:
                    for line in f:
                        if line.strip():
                            clicks.append(json.loads(line))
        except Exception as e:
            print(f"Error reading clicks: {e}")

        return clicks

    @staticmethod
    def get_click_statistics() -> Dict[str, Any]:
        """Get statistics about clicks"""
        clicks = ClickTracker.get_all_clicks()

        if not clicks:
            return {
                "total_clicks": 0,
                "unique_paths": 0,
                "most_common_path": None,
                "screens_visited": set(),
            }

        paths = {}
        screens = set()

        for click in clicks:
            path = click.get('path', '')
            paths[path] = paths.get(path, 0) + 1

            screens.add(click.get('from', ''))
            screens.add(click.get('to', ''))

        most_common_path = max(paths, key=paths.get) if paths else None

        return {
            "total_clicks": len(clicks),
            "unique_paths": len(paths),
            "most_common_path": most_common_path,
            "path_distribution": paths,
            "screens_visited": list(screens),
            "recent_clicks": clicks[-10:],  # Last 10 clicks
        }


# Global instance
click_tracker = ClickTracker()

