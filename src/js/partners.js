function partners() {
    if (typeof URLSearchParams == 'function') {

        var params = new URLSearchParams(location.search);

        var city_filter = params.get('where');

        var cities = ["bucuresti", "iasi", "cluj", "timisoara", "sibiu"];

        if (city_filter && city_filter != "online") {
            // Hide the row containing all partners on city pages
            document.getElementById("partners_all").style.display = 'none';
        } else {
            cities.forEach(function (city) {
                // Hide the local partners on non-city pages (main page)
                if (document.getElementById('partners_'+city)) {
                    document.getElementById('partners_'+city).style.display = 'none';    
                }
            });

            return;
        }
        
        cities.forEach(function (city) {
            if (city != city_filter) {
                if (document.getElementById('sponsors_'+city)) {
                    document.getElementById('sponsors_'+city).style.display = 'none';
                }
                if (document.getElementById('title_sponsors_'+city)) {
                    document.getElementById('title_sponsors_'+city).style.display = 'none';  
                }
                if (document.getElementById('partners_'+city).style) {
                    document.getElementById('partners_'+city).style.display = 'none';
                }
            }
        });
    }
}

module.exports = partners;