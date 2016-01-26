var token = '';
var maxConcurrent = 5;
var processingCount = 0;
var left = 0;

var subject = new Rx.ReplaySubject(
    200 /* buffer size */,
    null /* unlimited time buffer */,
    Rx.Scheduler.timeout);

var users = [
    'quis20',
    'daniel.talar',
    'zator55',
    'arkadiusz.nadolski',
    'mariano_italino',
    'Nuszwkartlo',
    'KWisniewski',
    'slygoblin',
    'danielgestwa',
    'wiski',
    'qba_02'
];

function renderStatus(text, id) {
    subject.onNext({text: text, id: id});
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function getToken() {
    chrome.cookies.get({name: 'csrftoken', url: 'http://www.checkio.org'}, function (cookie) {
        token = cookie.value;
    });
}

function checkUser() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var res = JSON.parse(xhttp.responseText);
            console.log(res);
            if (res.username) {
                var ind = users.indexOf(res.username);
                if (ind != -1) {
                    users.splice(ind, 1);
                }
                console.log(users);
                processUsers();
            }
            else {
                renderStatus('Musisz byc zalogowany do checkio');
            }
        }
        else {
            console.log(xhttp);
        }
    };
    xhttp.open("GET", "http://www.checkio.org/api/current-user/", true);
    xhttp.send();
}

var userProcessor = function (renderId) {
    var currentPage = null;

    function vote(user, ids) {
        var xhttp = new XMLHttpRequest();
        var id = ids.pop();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                startProcessing(user, ids);
            }
            else {
                console.log(xhttp);
            }
        };
        xhttp.open("PATCH", "http://www.checkio.org/api/votes/%7B%22object_id%22%3A" + id.toString()
            + "%2C%22content_type_id%22%3A%22283%22%7D/", true);
        var data = JSON.stringify({userVotes: 4});
        xhttp.setRequestHeader("X-CSRFToken", token);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(data);

    }

    function getCheckioPublications(user, page) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var res = JSON.parse(xhttp.responseText);
                console.log(res);
                var ids = res.objects.map(function (x) {
                    return x.id;
                });
                if (res.totalCount > 40 && page == 1) {
                    currentPage = 2;
                }
                else if (res.totalCount > 80 && page == 2) {
                    currentPage = 3;
                }
                console.log(ids.length);
                startProcessing(user, ids);
            }
            else {
                console.log(xhttp);
            }
        };
        if (typeof page == 'undefined') {
            xhttp.open("GET", "http://www.checkio.org/api/publications?username=" + user, true);
        }
        else {
            xhttp.open("GET", "http://www.checkio.org/api/publications?username=" + user + "&page=" + page, true);
        }

        xhttp.send();

    }

    function startProcessing(user, ids) {
        if (ids.length > 0) {
            var part = '';
            if (currentPage) {
                part = ' part ' + currentPage;
            }
            renderStatus("Przetwarzam: " + user + ' ' + ids.length + part, renderId);
            vote(user, ids);
        }
        else {
            if (currentPage) {
                processUser(user)
            }
            else {
                renderStatus('Zakonczono task:' + renderId.toString(), renderId);
                left = left - 1;
                processUsers(renderId);
            }
        }
    }

    function processUser(user) {
        if (user) {
            renderStatus("Przetwarzam: " + user + ' ?', renderId);
            left = left + 1;
            if (currentPage) {
                getCheckioPublications(user, currentPage);
            }
            else {
                getCheckioPublications(user);
            }
        }
    }

    return {processUser: processUser};
}.bind(this);

function processUsers(id) {
    if (users.length) {
        if (id) {
            var processor = userProcessor(id);
            processor.processUser(users.pop());
        }
        else {
            for (var i = 0; i < maxConcurrent; i++) {
                var processor = userProcessor(i);
                processor.processUser(users.pop());
            }
        }
    }
    else if (left == 0) {
        for (var i = 0; i < maxConcurrent; i++) {
            renderStatus('', i);
        }
        renderStatus('Koniec', 0);
    }
}

var initialized = false;
function init() {
    console.log('initializing');

    if (!initialized) {
        initialized = true;
        shuffleArray(users);
        console.log('constructed');
        getToken();
        checkUser();
    }
}