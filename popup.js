var token = '';
var currentUser = 0;
var currentPage = null;

var users = [
    'quis20',
    'Mahoter',
    'daniel.talar',
    'Adam.Michalak',
    'zator55',
    'Reycer',
];

function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

function checkUser(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var res = JSON.parse(xhttp.responseText);
            console.log(res);
            if(res.username){
                var ind = users.indexOf(res.username);
                users.splice(ind, 1);
                console.log(users);
                processUsers();
            }
            else{
                renderStatus('Musisz byc zalogowany do checkio');
            }
        }
        else
        {
            console.log(xhttp);
        }
    };
    xhttp.open("GET", "http://www.checkio.org/api/current-user/", true);
    xhttp.send();
}

function vote(user, ids){
    var xhttp = new XMLHttpRequest();
    var id = ids.pop();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            startProcessing(user,ids);
        }
        else
        {
            console.log(xhttp);
        }
    };
    xhttp.open("PATCH", "http://www.checkio.org/api/votes/%7B%22object_id%22%3A"+ id.toString()
        +"%2C%22content_type_id%22%3A%22283%22%7D/", true);
    var data = JSON.stringify({userVotes: 4});
    xhttp.setRequestHeader("X-CSRFToken", token);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);

}

function getCheckioPublications(user, page){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var res = JSON.parse(xhttp.responseText);
            console.log(res);
            var ids = res.objects.map(function(x){
                return x.id;
            });
            if(res.totalCount > 40 && page == 1){
                currentPage = 2;
            }
            else if(res.totalCount > 80 && page == 2){
                currentPage = 3;
            }
            else
            {
                currentPage = null;
            }
            console.log(ids.length);
            startProcessing(user, ids);
        }
        else
        {
            console.log(xhttp);
        }
    };
    xhttp.open("GET", "http://www.checkio.org/api/publications?username=" + user + "&page=" + page, true);
    xhttp.send();

}

function getToken(){
    chrome.cookies.get({name: 'csrftoken', url: 'http://www.checkio.org'}, function(cookie) {
        token = cookie.value;
    });
}

function startProcessing(user, ids){
    if(ids.length > 0) {
        var part = '';
        if(currentUser){
            part = ' part ' + currentUser;
        }
        renderStatus("Przetwarzam: " + user + ' ' + ids.length + part);
        vote(user,ids);
    }
    else
    {
        if(currentPage)
        {
            processUser(user)
        }
        else {
            processUsers();
        }
    }
}

function processUser(user){
    renderStatus("Przetwarzam: " + user + ' ?');
    if(currentPage) {
        getCheckioPublications(user, currentPage);
    }
    else
    {
        getCheckioPublications(user, 1);
    }
}

function processUsers(){
    if(currentUser <= users.length) {
        console.log(users);
        console.log(users[currentUser]);
        processUser(users[currentUser]);
        currentUser = currentUser + 1;
    }
    else
    {
        renderStatus('Zakonczono : )')
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('initialized');
    getToken();
    checkUser();
});
