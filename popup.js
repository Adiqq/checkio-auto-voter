function renderStatus(statusText, id) {
    if (!id) {
        id = '0';
    }
    else {
        id = id.toString();
    }
    document.getElementById('status' + id).textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('initialized');
    chrome.extension.getBackgroundPage().init();
    chrome.extension.getBackgroundPage().subject.subscribe(
        function (x) {
            renderStatus(x.text, x.id);
        },
        function (err) {
            console.log('Error: ' + err);
        });
});
