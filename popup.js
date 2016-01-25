function renderStatus(statusText, id) {
    if(!id){
        id = '0';
    }
    else{
        id = id.toString();
    }
    document.getElementById('status' + id).textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('initialized');
    //getToken();
    //checkUser();
    chrome.extension.getBackgroundPage().init();
    renderStatus(chrome.extension.getBackgroundPage().status);
    chrome.extension.getBackgroundPage().subject.subscribe(
        function (x) {
            renderStatus(x.text, x.id);
        },
        function (err) {
            console.log('Error: ' + err);
        },
        function () {
            console.log('Completed');
        });
});
