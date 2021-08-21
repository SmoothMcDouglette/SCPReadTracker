'use strict'

const stateManager = new StateManager();
const BaseUrl = 'http://www.scpwiki.com/scp-';

function exportRaw(){
    console.log("exportttt");
}

/**
 * Processes popup page - lists read pages & prepares download link
 */
 function process() {
    console.log("process");
    var readPages = stateManager.getStates(true);

    var pageReadCount = $('#pages-read-count');
    pageReadCount.text(readPages.length);

    var list = $('ul#read-pages');
    for (var i = 0; i < readPages.length; i++) {
        // Create link to read page & add to list
        var href = readPages[i].uri;
        console.log("Title is ");
        console.log(readPages[i].title);
        var a = $('<a>').attr('href', href).text(readPages[i].title);
        var li = $('<li>').addClass('item-read').append(a);
        list.append(li);
    }

    $('#wipe-button').click(function () {
        stateManager.wipeData();
    });
}

/**
 * Main entry point
 */
function main() {
    console.log("main");
    // Initialize state manager.
    stateManager.initialize(process);
}

main();