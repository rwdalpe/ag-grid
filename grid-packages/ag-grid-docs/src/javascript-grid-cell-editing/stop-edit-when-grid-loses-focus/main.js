var gridOptions = {
    columnDefs: [
        { field: 'athlete', minWidth: 160 },
        { field: 'age' },
        { field: 'country', minWidth: 140 },
        { field: 'year', cellEditor: 'yearCellEditor' },
        { field: 'date', minWidth: 140 },
        { field: 'sport', minWidth: 160 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        editable: true,
    },
    components:{
        yearCellEditor: getYearCellEditor()
    },
    // this property tells grid to stop editing if the
    // grid loses focus
    stopEditingWhenGridLosesFocus: true
};

function getYearCellEditor() {
    function YearCellEditor() {}

    YearCellEditor.prototype.getGui = function() {
        return this.eGui;
    };

    YearCellEditor.prototype.getValue = function() {
        return this.value;
    };

    YearCellEditor.prototype.isPopup = function() {
        return true;
    };

    YearCellEditor.prototype.init = function(params) {
        this.value = params.value;
        var tempElement = document.createElement('div');
        tempElement.innerHTML =
            '<div class="yearSelect">' +
            '<div>Clicking here does not close the popup!</div>' +
            '<button id="bt2006" class="yearButton">2006</button>' +
            '<button id="bt2008" class="yearButton">2008</button>' +
            '<button id="bt2010" class="yearButton">2010</button>' +
            '<button id="bt2012" class="yearButton">2012</button>' +
            '<div>' +
            '<input type="text" style="width: 100%;" placeholder="clicking on this text field does not close"/>' +
            '</div>' +
            '</div>';

        var that = this;
        [2006, 2008, 2010, 2012].forEach(function(year) {
            tempElement.querySelector('#bt' + year).addEventListener('click', function() {
                that.value = year;
                params.stopEditing();
            });
        });

        this.eGui = tempElement.firstChild;
    };
    return YearCellEditor;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    // do http request to get our sample data - not using any framework to keep the example self contained.
    // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', 'https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/olympicWinnersSmall.json');
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            var httpResult = JSON.parse(httpRequest.responseText);
            gridOptions.api.setRowData(httpResult);
        }
    };
});
