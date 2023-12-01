$(document).ready(function () {
    geo = navigator.geolocation;
    var departurePoint = [];
    var busStops = [];

    var tripId = [];
    var stopId = [];   
    var routeId = [];
    var busNumbers = [];
    var stopTimes = []

    var ttt = []

    var closestBusStops = []

    const successCallback = async (position) => {
        await SuccessTest(position)
        

    }
    const errorCallback = (error) => {
        console.log(error);
    }

    async function SuccessTest (position){
        let userLat = await position.coords.latitude;
        let userLon = await position.coords.longitude;
        await FindClosestCoords(userLat, userLon);
        console.log(userLat, userLon);
    }

    geo.getCurrentPosition(successCallback, errorCallback);


    async function FindClosestCoords(userLat, userLon){
        const url = `http://localhost:8055/getClosestStop?lat=${userLat}&lon=${userLon}`
        const res = await fetch(url);
        const data = await res.json();
        data.forEach(element => {
            closestBusStops.push(element)
        });
        $('#departurePointField').val(closestBusStops[0].stop_area)
        $('#busStopsField').val(closestBusStops[0].stop_name);
        await DepField()
        //await CommonQuery('selectBusStop', 'busArea', closestBusStops[0].stop_area, busStops, 'stop_name');
        await BusFieldAction(closestBusStops[0].stop_name);
        await GetBusNumber();

    }


    async function CommonQuery(path, param, userValue, arrayName, lookingValue) {
        userQuery = `http://localhost:8055/${path}?${param}=${userValue}`
        await fetch(userQuery)
        .then(res => res.json())
        .then((res) => {
            for (let i = 0; i < res.length; i++) {
                let stringValue = String(res[i][lookingValue]);
                if(arrayName && !arrayName.includes(stringValue))
                arrayName.push(stringValue) 
            }
        })
    };


    async function BusFieldAction(stopName){
        // find bus stop
        await CommonQuery('getStopId', 'stopName', stopName, stopId, 'stop_id')

        for(const elem of stopId){
            await CommonQuery('getTripId', 'stopId', elem, tripId, 'trip_id')
        }
    }

    

    // App starts 
    CommonQuery('selectDeparturePoint', '', '', departurePoint, 'stop_area');

    

    const DepField = async () => {
        $("#departurePointField").autocomplete({
            source: departurePoint,
            async: true,
            select: function (event, ui) {
                let cityName = ui.item.value;
                CommonQuery('selectBusStop', 'busArea', cityName, busStops, 'stop_name');
            },
            minLength: 2,
            close: function () {
                while (busStops.length != 0) {
                    busStops.pop();
                }
                $('#busStopsField').val('');
                DeleteButtonsAndTimes()
            }
        });
    }
    


    document.getElementById('departurePointField').onclick = () => {
        //"Departure point" inpud field
        DepField()
    }

    document.getElementById('busStopsField').onclick = () => {
        //"Bus stop" input field
        $("#busStopsField").autocomplete({
            source: busStops,
            async: true,
            select: function (event, ui) {
                //eg Kreenholmi
                let stopName = ui.item.value;
                BusFieldAction(stopName)
                
            },
            minLength: 2,
            close: function(){
                DeleteButtonsAndTimes()
            }
        });
    }


    async function GetBusNumber(){
        // Find ROUTE ID using TRIP ID
        for(let elem of tripId){
            //await CommonQuery('getRouteId', 'tripId', elem, routeId, 'route_id')
            const url = `http://localhost:8055/getRouteId?tripId=${elem}`
            const res = await fetch(url);
            const data = await res.json();
            data.forEach(async(element) => {
                let stringValue = String(element['route_id']);
                var dat = {trip_id: elem, route_id: stringValue}
                if(ttt && !ttt.includes(stringValue)){
                    await ttt.push(stringValue)
                    await routeId.push(dat) 
                }
            });
        }

        //console.log(tripId)


        // Find BUS NUMBER using ROUTE ID
        for(let elem of routeId){
            //await CommonQuery('getBusNumber', 'routeId', elem.route_id, busNumbers, 'route_short_name')

            const url = `http://localhost:8055/getBusNumber?routeId=${elem.route_id}`
            const res = await fetch(url);
            const data = await res.json();
            data.forEach(async (element) => {
                    let stringValue = String(element['route_short_name']);
                    if(busNumbers && !busNumbers.includes(stringValue)){
                        await busNumbers.push(stringValue) 
                        elem.bus_number = stringValue;
                    }
            });

        }

        await CreateBusNumberLabel(routeId);


        busStops = []
        busNumbers = [];
        stopId = []
        tripId = [];

    }
    
    function ParseTime(s) {
        var c = s.split(':');
        return parseInt(c[0]) * 60 + parseInt(c[1]);
     }

    function Sorter(arr){
        var now = new Date().toLocaleTimeString('ee-EE', {hour12: false});
        arr.sort(function(a, b) {
            var aa = ParseTime(a)
            var bb = ParseTime(b)
            var nowaa = (ParseTime(now))
            //console.log(aa + ' - '  + nowaa)
            var distancea = Math.abs(nowaa - aa);
            var distanceb = Math.abs(nowaa - bb);
            return  distanceb - distancea; // sort a before b when the distance is smaller
        });
    }

    async function TimeDiff(lis){
        const url = `http://localhost:8055/getTime?stopId=${lis.trip_id}`
        const res = await fetch(url);
        const data = await res.json();

        for(const element of data){
            let stringValue = String(element['arrival_time']);
            if(stopTimes && !stopTimes.includes(stringValue)){
                await stopTimes.push(stringValue) 
                lis.stop_time += stringValue + ' - ';
            }
        }

        lis.stop_time = lis.stop_time.replace('undefined', '')
        var arr = lis.stop_time.split('-').map(item => item.trim()).filter(e => e);
        Sorter(arr);
        //console.log(arr)

        var isLongerThanFive = arr.length > 5 ? 5 : arr.length

        for (let i = 0; i < isLongerThanFive; i++) {
            var div = document.getElementById('times');
            div.innerHTML += arr[i] + "<br />"
        }

    }
    // Create buttons with bus number label
    async function CreateBusNumberLabel(lis) {
        console.log(lis)
        if(lis){
            lis.sort((a, b) => a - b);
            for (let i = 0; i < lis.length; i++) {
                const button = document.createElement("button");
                button.id = "bus" + i;
                //button.className = "m-2 btn btn-primary";
                button.className = "xD";
                var shortBusNum = lis[i].bus_number;
                await shortBusNum
                button.innerHTML = await shortBusNum;
                button.addEventListener('click', async function() {TimeDiff(lis[i]), document.getElementById("times").innerHTML = "";});
    
                button.style.width = '50px';
                button.style.height = '50px';
                button.style.fontSize = '20px';
                button.style.borderRadius = '50px';
                button.style.border = 'none';
                button.style.marginLeft = '5px';
                //room.appendChild(button);  
                document.getElementById("buttons").appendChild(button);       
            }
        }
        $("body").css("cursor", "default");
    }
    
    // Activates when "Get bus number" was pressed
    document.getElementById('busNumberField').onclick = () => {
        $("body").css("cursor", "progress");
        document.getElementById("times").innerHTML = "";
        if(routeId.length > 0){
            for (let i = 0; i < routeId.length; i++) {
                try{
                    document.getElementById("bus" + i).remove(); 
                }catch{}
            }
        }

        //document.getElementById("times").innerHTML = "";

        routeId = []

        if($('#busStopsField').val().length > 0) {
            GetBusNumber();
        }
        else {
            alert('Can not be empty')
        }



    }


    function DeleteBusButtons(){
        if(routeId.length > 0){
            for (let i = 0; i < routeId.length; i++) {
                try{
                    document.getElementById("bus" + i).remove(); 
                }catch{}
            }
        }
    }

    function DeleteTimes(){
        document.getElementById("times").innerHTML = "";
    }

    document.getElementById('annihilateAll').onclick = () => {
        DeleteTimes()
        DeleteBusButtons()
        DeleteInfo()
    }

    
    function DeleteInfo(){
        $('#departurePointField').val('');
        $('#busStopsField').val('');

        $("#departurePointField").autocomplete({source: []});
        $("#busStopsField").autocomplete({source: []});

        busStops = [];
        tripId = [];
        stopId = [];   
        routeId = [];
        busNumbers = [];

    }

    function DeleteButtonsAndTimes(){
        DeleteBusButtons()
        DeleteTimes();
    }



      
});
