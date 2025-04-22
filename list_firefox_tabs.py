import requests

def get_chromium_tabs():
    # Chromium DevTools Protocol endpoint (default port is 9222)
    devtools_url = "http://localhost:9222/json"

    try:
        # Fetch the list of open tabs
        response = requests.get(devtools_url)
        response.raise_for_status()
        tabs = response.json()

        # Process and display the tabs
        for tab in tabs:
            print(f"Title: {tab.get('title', 'N/A')}")
            print(f"URL: {tab.get('url', 'N/A')}")
            print("=" * 40)

    except requests.exceptions.ConnectionError:
        print("Error: Unable to connect to Chromium DevTools. Is Chromium running with remote debugging enabled?")
    except Exception as e:
        print(f"An error occurred: {e}")

# Call the function to list Chromium tabs
get_chromium_tabs()