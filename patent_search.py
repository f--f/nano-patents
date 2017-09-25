import requests
import bs4
import sqlite3

# Relevant API Documentation:
# USPTO: https://developer.uspto.gov/ibd-api-docs/
# Google Maps: https://developers.google.com/maps/documentation/geocoding/intro
USPTO_API = "https://developer.uspto.gov/ibd-api/v1/patent/application"
MAPS_API = "https://maps.googleapis.com/maps/api/geocode/json"

# Link to individual USPTO search page by patent number:
USPTO_PAGE = "http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HIT\
OFF&d=PALL&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.htm&r=1&f=G&l=50&s1={}.PN."

SQLITE_DB = "db.sqlite"


def get_latlon(location):
    """Gets latitude and longitude corresponding to a place using Google Maps
    API."""
    result = requests.get(MAPS_API, params={"address": location})
    return result.json()['results'][0]['geometry']['location']


def scrape_patent_web(patent_num):
    """Returns BS4/HTML of USPTO patent search for a patent entry. Contains
    extra information (location, text) not available through API."""
    patent_html = USPTO_PAGE.format(patent_num)
    return bs4.BeautifulSoup(requests.get(patent_html).content, "lxml")


def get_location(patent):
    """Gets location of company associated with patent entry (dict)."""
    html = scrape_patent_web(patent['patentNumber'])
    # Grab metadata table
    ass_loc = html.find(text="Assignee:").find_next()
    # Split tag contents so that only first assignee location is retrieved
    ass_text = ass_loc.text.split('\n\n')[0].replace('\n','')
    lind = ass_text.find("(")
    rind = ass_text.rfind(")")
    return ass_text[lind+1:rind]


def get_abstract(patent):
    """Gets abstract of company associated with patent entry (dict)."""
    html = scrape_patent_web(patent['patentNumber'])
    # Abstract is only paragraph tag on page.
    return ' '.join(html.p.contents[0].split())


if __name__ == '__main__':

    # Search for successful (granted) patent applications in nanotechnology
    search_params = {"searchText": "nano", "applicationType": "UTILITY",
                     "documentType": "grant", "rows": 100, 'sortOrder': 'desc'}
    response = requests.get(USPTO_API, params=search_params)

    # Check if request went through successfully (status code 200)
    if response.status_code == 200:

        # Get list of results
        patents = response.json()['response']['docs']

        # Populate a new SQLite database
        db = sqlite3.connect(SQLITE_DB)

        # Overwrite old data
        db.execute("DROP TABLE IF EXISTS patents")
        db.execute("""CREATE TABLE patents 
            (id INTEGER PRIMARY KEY, title TEXT, year INTEGER, assignee TEXT, 
            city TEXT, abstract TEXT, lat REAL, lng REAL)""")

        for pat in patents:
            print(pat['patentNumber'], pat['title'])

            # Skip patent if there's no company listed.
            if "assignee" not in pat:
                print("No company assigned to patent - skipping.")
                continue
            try:
                city = get_location(pat)
                loc = get_latlon(city)
                print(city, loc)
            except (IndexError, KeyError):
                print("Can't grab location information - skipping.")
                continue
            abstr = get_abstract(pat)

            db.execute("INSERT INTO patents VALUES (?,?,?,?,?,?,?,?)",
                    (int(pat['patentNumber']), pat['title'], int(pat['year']),
                     pat['assignee'][0], city, abstr, loc['lat'], loc['lng']))

        db.commit()
        db.close()

    else:
        print("Unexpected response code:", response.status_code)
