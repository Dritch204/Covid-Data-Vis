setInterval(() => {
    document.getElementById('time').innerHTML = moment().format('MMMM Do YYYY');
}, 1000);

let countries_data = [];

const breif_summary = fetch('https://covid-19-report-api.now.sh/api/v1/cases/brief')
    .then(res => res.json())
    .then(res => {
        document.getElementById('confirmed').innerHTML = valueFormatter(res.data.confirmed);
        document.getElementById('recovered').innerHTML = valueFormatter(res.data.recovered);
        document.getElementById('deaths').innerHTML = valueFormatter(res.data.deaths);
    })

const country_report = fetch('https://covid-19-report-api.now.sh/api/v1/cases/latest?onlyCounties=true')
    .then(res => res.json())
    .then(res => countries_data = res.data.filter(d => d.provincestate === ''))

function tooltip(d) {
    const country_iso_code = d.properties.iso_a2;
    const country_name = d.properties.sovereignt;
    console.log(country_name);
    let country_data = countries_data.filter(country => country.countryregion === country_name)[0];
    if (!country_data) country_data = countries_data.filter(country => {
        if (country.countrycode) {
            if (country.countrycode.iso2 === country_iso_code) return true
        }
        else {
            return false
        }
    })[0];
    if (!country_data) return ''
    return `<div style="background-color: white; height: 100%;width: 200px; text-align: center;border: 1px solid #B0B0B0">
        <p style="padding-top: 10px;margin-bottom: 10px;font-weight: bold;">${country_data.countryregion}</p>
        <hr>
        <div style="display: flex; flex-direction: row;justify-content: space-between;padding: 0 10px;">
            <p>Confirmed</p>
            <p style="color: #EB3774;font-weight: bold;">${valueFormatter(country_data.confirmed)}</p>
        </div>
        <!--<div style="display: flex; flex-direction: row;justify-content: space-between;padding: 0 10px;">
            <p>Confirmed in 24H</p>
            <p style="color: #EB3774;font-weight: bold;">${country_data.countryregion}</p>
        </div>-->
        <div style="display: flex; flex-direction: row;justify-content: space-between;padding: 0 10px;">
            <p>Recovered</p>
            <p style="color: #2aa649;;font-weight: bold;">${valueFormatter(country_data.recovered)}</p>
        </div>
        <div style="display: flex; flex-direction: row;justify-content: space-between;padding: 0 10px;">
            <p>Dead</p>
            <p style="color: #5a5a5a;font-weight: bold;">${valueFormatter(country_data.deaths)}</p>
        </div>
        <!--<div style="display: flex; flex-direction: row;justify-content: space-between;padding: 0 10px;">
            <p>Dead in 24H</p>
            <p style="color: #B0B0B0;font-weight: bold;">${country_data.countryregion}</p>
        </div>-->
    </div>`
}

function generateArrayMinMax(min, max, nums) {
    let list = [min],
        interval = (max - min) / (nums - 1);

    for (let i = 1; i < nums - 1; i++) {
        list.push((min + interval * i));
    }
    list.push(max);                        // prevent floating point arithmetic errors
    return list;
}

function valueFormatter(value) {
    if (!value) return 'NA'
    if (value > 999999) {
        return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value > 999 && value < 1000000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value
}

Promise.all([breif_summary, country_report])
    .then(() => {
        const margin = { top: 0, right: 0, bottom: 0, left: 0 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        const svg = d3.select('#map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', 'translate(0, 0)');

        d3.json('custom.geo.json', (err, worldMap) => {

            if (err) return

            const projection = d3.geoMercator()
                .center([10, 10])
                .scale(150)
                .translate([width / 2, height / 1.5]);

            //create map
            const path = d3.geoPath()
                .projection(projection);

            const [confirmed_min, confirmed_max] = [Math.min(...countries_data.filter(d => d.confirmed).map(d => d.confirmed)), Math.max(...countries_data.filter(country => country.confirmed).map(d => d.confirmed))]

            const ranges = generateArrayMinMax(confirmed_min, confirmed_max, 9);

            const colorScale = d3.scaleThreshold()
                .domain(ranges)
                .range(d3.schemeReds[9]);

            svg.selectAll('path')
                .data(worldMap.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', (d) => colorScale(d.properties.pop_est))
                .call(d3.helper.tooltip(d => {
                    return tooltip(d)
                }));

        })
    })


