# netlify-gpsbabel-functions
Use GPSBabel as netlify function

## [GPSBabel](https://www.gpsbabel.org/)

Simple wrapper to use some GPSBabel Functionality as API

Currently the following is supported:

- Convert between gpx, kml, (geo)json, tcx [Formats](https://www.gpsbabel.org/htmldoc-1.5.4/The_Formats.html)
- [Simplify Filter](https://www.gpsbabel.org/htmldoc-1.5.4/filter_simplify.html)
- [Position Filter](https://www.gpsbabel.org/htmldoc-1.5.4/filter_position.html)

Pass the url to the file as GET parameter or the
Content as Body in an POST Request

### Examples:
**Method:** GET

 `/.netlify/functions/gpsbabel?infile=https://developers.google.com/kml/documentation/KML_Samples.kml&outtype=geojson&distance=8m&points=500`

**Query:**
- `infile` - absolute URL to the input file
- `outtype` - format to be converted into
- `disance` - optional - (use the simplify filter if set)
- `count` - optional - (use the position filter if set)

**Method:** POST

 `/.netlify/functions/gpsbabel?intype=gpx&outtype=geojson`

**Query:**
- `body` - File Content
- `intype` - input format
- `outtype` - format to be converted into
- `disance` - optional - (use the simplify filter if set)
- `count` - optional - (use the position filter if set)


### Deploy with Netlify

Find out more about [Netlify Functions](https://www.netlify.com/products/functions/) and try it out by deploying to your netlify account

<a href="https://app.netlify.com/start/deploy?repository=https://github.com/khuppenbauer/netlify-gpsbabel-functions" target="_blank"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify"></a>

After clicking that button, follow the provided steps. Afterwards you will find the functions under the functions item in your netlify project