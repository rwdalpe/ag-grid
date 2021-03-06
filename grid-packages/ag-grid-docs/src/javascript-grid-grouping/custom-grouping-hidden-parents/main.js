var gridOptions = {
    columnDefs: [
        {headerName: 'Country', showRowGroup: 'country', cellRenderer: 'agGroupCellRenderer', minWidth: 200 },
        {headerName: 'Year', valueGetter: 'data.year', showRowGroup: 'year', cellRenderer: 'agGroupCellRenderer' },

        { field: 'athlete', minWidth: 200 },
        { field: 'gold', aggFunc: 'sum' },
        { field: 'silver', aggFunc: 'sum' },
        { field: 'bronze', aggFunc: 'sum' },
        { field: 'total', aggFunc: 'sum' },

        {field: 'country', rowGroup: true, hide: true},
        {field: 'year', rowGroup: true, hide: true},
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        sortable: true,
        resizable: true,
    },
    groupSuppressAutoColumn: true,
    groupHideOpenParents: true,
    enableRangeSelection: true,
    animateRows: true
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    // do http request to get our sample data - not using any framework to keep the example self contained.
    // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
    agGrid.simpleHttpRequest({url: 'https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/olympicWinnersSmall.json'}).then(function(data) {
        gridOptions.api.setRowData(data);
    });
});
