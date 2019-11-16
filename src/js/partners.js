function partners() {
    if (typeof URLSearchParams == 'function') {

        var params = new URLSearchParams(location.search);

        var city_filter = params.get('where');

        var cities = ["bucuresti", "iasi", "cluj", "timisoara"];

        if (city_filter) {
            document.getElementById("partners_all").style.display = 'none';
        } else {
            cities.forEach(function (city) {
                if (document.getElementById('partners_'+city)) {
                    document.getElementById('partners_'+city).style.display = 'none';    
                }
            });

            return;
        }
        
        cities.forEach(function (city) {
            if (city != city_filter) {
                if (document.getElementById('sponsors_'+city)) {
                    document.getElementById('sponsors_'+city).parentElement.parentElement.style.display = 'none';    
                }
                if (document.getElementById('partners_'+city).style) {
                    document.getElementById('partners_'+city).style.display = 'none';
                }
            }
        });
    }
}

module.exports = partners;