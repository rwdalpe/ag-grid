<?php
$pageTitle = "Custom Icons: Styling & Appearance Feature of our Datagrid";
$pageDescription = "Core feature of ag-Grid supporting Angular, React, Javascript and more. One such feature is Custom Icons. All the icons in the grid can be replaced with your own Custom Icons. You can either use CSS or provide your own images. Version 20 is available for download now, take it for a free two month trial.";
$pageKeywords = "ag-Grid Pinning";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

<h1>Icons</h1>

    <p class="lead">
        This sections details how to provide your own icons for the grid and style grid icons for your application requirements.
    </p>

<h2>Change individual icons using CSS</h2>

<p>You can change individual icons by overriding the background images for the respective CSS selector.
The following code snippet overrides the Balham theme pin icon used in the drag hint when reordering columns:<p>

<snippet>
/*
 * The override should be placed after the import of the theme.
 * Alternatively, you can aso increase the selector's specificity.
 */
.ag-theme-balham .ag-icon-pin {
    font-family: "Font Awesome 5 Free";
    /* FontAwesome uses font-weight bold */
    font-weight: bold;
}
.ag-theme-balham .ag-icon-pin::before {
    content: '\f08d';
}
</snippet>

<h2>Replace the icons by changing the icon font</h2>

<p>If you are using a <a href="/javascript-grid-styling/">custom theme</a> in your project, you can include use theme parameters to change the icon font.
    We <a href="https://github.com/ag-grid/ag-grid-customise-theme/tree/master/src/vanilla">provide an example</a>
    that does this, and the relevant code looks like this:

    <snippet>
@import "~ag-grid-community/src/styles/ag-grid.scss";
@import "~ag-grid-community/src/styles/ag-theme-alpine-mixin.scss";

.ag-theme-alpine {
    @include ag-theme-alpine((
        "icon-font-family": "Font Awesome 5 Free",
        "icons-data": null, // prevent default font frombeing embedded
        "icons-font-codes": (
            "aggregation": "\f247",
            "arrows": "\f0b2",
            "asc": "\f062",
            "cancel": "\f057",
            "chart": "\f080",
            "checkbox-checked": "\f14a",
            "checkbox-indeterminate": "\f146",
            "checkbox-unchecked": "\f0c8",
            "color-picker": "\f576",
            "columns": "\f0db",
            "contracted": "\f146",
            "copy": "\f0c5",
            "cross": "\f00d",
            "desc": "\f063",
            "expanded": "\f0fe",
            "eye-slash": "\f070",
            "eye": "\f06e",
            "filter": "\f0b0",
            "first": "\f100",
            "grip": "\f58e",
            "group": "\f5fd",
            "last": "\f101",
            "left": "\f060",
            "linked": "\f0c1",
            "loading": "\f110",
            "maximize": "\f2d0",
            "menu": "\f0c9",
            "minimize": "\f2d1",
            "next": "\f105",
            "none": "\f338",
            "not-allowed": "\f05e",
            "paste": "\f0ea",
            "pin": "\f276",
            "pivot": "\f074",
            "previous": "\f104",
            "radio-button-off": "\f111",
            "radio-button-on": "\f058",
            "right": "\f061",
            "save": "\f0c7",
            "small-down": "\f107",
            "small-left": "\f104",
            "small-right": "\f105",
            "small-up": "\f106",
            "tick": "\f00c",
            "tree-closed": "\f105",
            "tree-indeterminate": "\f068",
            "tree-open": "\f107",
            "unlinked": "\f127",
        )
    ));

    .ag-icon {
        // required because Font Awesome uses bold for its icons
        font-weight: bold;
    }
}

</snippet>

<p>Alternatively, if you are swapping one theme's icon set for another, you do not need to define an icon map because all theme fonts use the same map. This example shows the use of Alpine with the Material font:

<snippet>
@import "~ag-grid-community/src/styles/ag-grid.scss";
@import "~ag-grid-community/src/styles/ag-theme-alpine-mixin.scss";

// load Material font
@import "~ag-grid-community/src/styles/webfont/agGridMaterialFont.scss";

.ag-theme-alpine {
    @include ag-theme-alpine((
        "icon-font-family": "agGridMaterial", // use Material font
        "icons-data": null, // prevent default font from being embedded
    ));
}

</snippet>

<p>A working project with Sass / Webpack set up to customise an icon set is available in the <a href="https://github.com/ag-grid/ag-grid-customise-theme">ag grid customising theme repository</a>.

<h2>Set the icons through <code>gridOptions</code> (JavaScript)</h2>

<p>
    The icons can either be set on the grid options (all icons) or on the column definition (all except group).
    If defined in both the grid options and column definitions, the column definition will get used. This
    allows you to specify defaults in the grid options to fall back on, and then provide individual icons for
    specific columns. This is handy if, for example, you want to include 'A..Z' as string sort icons and just
    the simple arrow for other columns.
</p>

<p>
    The icons are set as follows:
</p>

<snippet>

// header column group shown when expanded (click to contract)
columnGroupOpened
// header column group shown when contracted (click to expand)
columnGroupClosed
// tool panel column group contracted (click to expand)
columnSelectClosed
// tool panel column group expanded (click to contract)
columnSelectOpen
// column tool panel header expand/collapse all button, shown when some children are expanded and
//     others are collapsed
columnSelectIndeterminate
// shown on ghost icon while dragging column to the side of the grid to pin
columnMovePin
// shown on ghost icon while dragging over part of the page that is not a drop zone
columnMoveHide
// shown on ghost icon while dragging columns to reorder
columnMoveMove
// animating icon shown when dragging a column to the right of the grid causes horizontal scrolling
columnMoveLeft
// animating icon shown when dragging a column to the left of the grid causes horizontal scrolling
columnMoveRight
// shown on ghost icon while dragging over Row Groups drop zone
columnMoveGroup
// shown on ghost icon while dragging over Values drop zone
columnMoveValue
// shown on ghost icon while dragging over pivot drop zone
columnMovePivot
// shown on ghost icon while dragging over drop zone that doesn't support it, e.g.
//     string column over aggregation drop zone
dropNotAllowed
// shown on row group when contracted (click to expand)
groupContracted
// shown on row group when expanded (click to contract)
groupExpanded
// context menu chart item
chart
// chart window title bar
close
// X (remove) on column 'pill' after adding it to a drop zone list
cancel
// indicates the currently active pin state in the "Pin column" sub-menu of the column menu
check
// "go to first" button in pagination controls
first
// "go to previous" button in pagination controls
previous
// "go to next" button in pagination controls
next
// "go to last" button in pagination controls
last
// shown on top right of chart when chart is linked to range data (click to unlink)
linked
// shown on top right of chart when chart is not linked to range data (click to link)
unlinked
// "Choose colour" button on chart settings tab
colorPicker
// rotating spinner shown by the loading cell renderer
groupLoading
// button to launch enterprise column menu
menu
// filter tool panel tab
filter
// column tool panel tab
columns
// button in chart regular size window title bar (click to maximise)
maximize
// button in chart maximised window title bar (click to make regular size)
minimize
// "Pin column" item in column header menu
menuPin
// "Value aggregation" column menu item (shown on numeric columns when grouping is active)"
menuValue
// "Group by {column-name}" item in column header menu
menuAddRowGroup
// "Un-Group by {column-name}" item in column header menu
menuRemoveRowGroup
// context menu copy item
clipboardCopy
// context menu paste item
clipboardPaste
// identifies the pivot drop zone
pivotPanel
// "Row groups" drop zone in column tool panel
rowGroupPanel
// columns tool panel Values drop zone
valuePanel
// drag handle used to pick up draggable columns
columnDrag
// drag handle used to pick up draggable rows
rowDrag
// context menu export item
save
// version of small-right used in RTL mode
smallLeft
// separater between column 'pills' when you add multiple columns to the header drop zone
smallRight
// show on column header when column is sorted ascending
sortAscending
// show on column header when column is sorted descending
sortDescending
// show on column header when column has no sort, only when enabled with gridOptions.unSortIcon=true
sortUnSort
</snippet>

<p>
    Setting the icons on the column definitions is identical, except group icons are not used in column definitions.
</p>

<p>
    The icon can be any of the following:
</p>
    <ul class="content">
        <li>
            <b>String:</b> The string will be treated as html. Use to return just text, or HTML tags.
        </li>
        <li>
            <b>Function:</b> A function that returns either a String or a DOM node or element.
        </li>
    </ul>

<h2>Changing checkbox and radio button icons</h2>

<p>As of version 23, checkboxes and radio buttons are native browser inputs styled using CSS. This means that you can change the appearance of the checkbox with Sass, but not using the JavaScript <code>gridOptions</code> technique. Using Sass, you can either change the icon font (set the <code>checkbox-*</code> and <code>radio-button-*</code> entries in the icon font codes map) or add CSS rules to override the appearance of the checkbox.</p>

<h2>Example</h2>

<p>
    The example below shows a mixture of different methods for providing icons. The grouping is done with images,
    and the header icons use a mix of Font Awesome and strings.
</p>

<?= grid_example('Icons', 'icons', 'generated', ['enterprise' => true, 'exampleHeight' => 660, 'extras' => ['fontawesome']]) ?>

<h2>SVG Icons</h2>

<p>
    When you create your own theme as described in <a href="/javascript-grid-themes-provided/#customising-themes">Customising Themes</a>,
    you are also able to replace the WebFont with SVG Icons.

    To do that you will need to override the <code>ag-icon</code> SASS rules and also the rules for each icon.
    You can see the example <code>styles.scss</code> file in our custom theme with SVG icons example here:
    <a href="https://github.com/ag-grid/ag-grid-customise-theme/tree/master/src/vanilla-svg-icons">SVG Icons Example</a>.
</p>

<note>
    <p>
        The grid sets the CSS <code>color</code> property on the <code>&lt; span class="ag-icon"&gt;</code> element representing the icon. This works for webfont-based icons, but not for SVG. If you are using SVG for icons, you should ensure that the provided SVG image is already the correct color.
    </p>
</note>

<h2>Provided theme icons</h2>

<p>
    Below you can see a list with all available icons for each theme, their names, and download them.
</p>

<style>
    .nav.nav-tabs .nav-link {
        color: #fff;
    }
    .nav.nav-tabs .nav-link.active {
        color: #000;
    }
    .tab-pane.active {
        display: flex;
        flex-direction: column;
    }
    .col {
        border: 1px solid transparent;
        border-right-color: lightgrey;
        border-bottom-color: lightgray;
        font-size: 0.8rem;
    }

    .tile {
        height: 5rem;
    }
    .tile img {
        height: 32px;
    }
    .tile p {
        margin: 0;
    }

    .download a {
        color: #ebebeb;
    }
    .download a:hover {
        color: #fff;
        text-decoration: none;
    }
</style>

<script>
    function addIconsToContainer(theme) {
        var icons = [
            'aggregation', 'arrows', 'asc', 'cancel', 'chart',
            'checkbox-checked', 'checkbox-indeterminate',
            'checkbox-unchecked', 'color-picker',
            'columns', 'contracted', 'copy', 'cross',
            'desc', 'expanded', 'eye-slash', 'eye', 'filter', 'first',
            'grip', 'group', 'last', 'left', 'linked',
            'loading', 'maximize', 'menu', 'minimize', 'next',
            'none', 'not-allowed', 'paste', 'pin', 'pivot',
            'previous', 'radio-button-off', 'radio-button-on', 'right',
            'save', 'small-down', 'small-left', 'small-right', 'small-up',
            'tick', 'tree-closed', 'tree-indeterminate', 'tree-open', 'unlinked'
        ];

        var container = document.querySelector('#' + theme);

        if (!container) {
            return;
        }
        var wrapper = document.createElement('div');
        wrapper.classList.add('row');
        wrapper.classList.add('mx-0');
        wrapper.style.overflowY = 'auto';
        container.insertAdjacentElement('afterbegin', wrapper);

        icons.forEach(function(icon) {
            var tile = document.createElement('div');
            var img = document.createElement('img');
            var name = document.createElement('p');
            tile.classList.add('tile');
            tile.classList.add('col');
            tile.classList.add('col-3');
            tile.classList.add('p-0');
            tile.classList.add('d-flex');
            tile.classList.add('flex-column')
            tile.classList.add('align-items-center');
            tile.classList.add('justify-content-center');

            tile.appendChild(img);
            tile.appendChild(name);


            img.setAttribute('src', './resources/' + theme + '/' + icon + '.svg');
            img.setAttribute('title', icon);

            name.innerHTML = icon;

            wrapper.appendChild(tile);
        });
    }

    window.addEventListener("load", function() {
        var themes = ['alpine', 'balham', 'material', 'base'];

        themes.forEach(function(theme) {
            addIconsToContainer(theme);
        });
    });
</script>
    <ul class="nav nav-tabs bg-primary pl-2 pt-2" id="icon-tabpanel" role="tablist">
        <li class="nav-item mr-2">
            <a class="nav-link active" id="alpine-tab" data-toggle="tab" href="#alpine" role="tab" aria-controls="alpine" aria-selected="true">Alpine Icons</a>
        </li>
        <li class="nav-item mr-2">
            <a class="nav-link" id="balham-tab" data-toggle="tab" href="#balham" role="tab" aria-controls="balham" aria-selected="true">Balham Icons</a>
        </li>
        <li class="nav-item mr-2">
            <a class="nav-link" id="material-tab" data-toggle="tab" href="#material" role="tab" aria-controls="material" aria-selected="false">Material Icons</a>
        </li>
        <li class="nav-item mr-2">
            <a class="nav-link" id="base-tab" data-toggle="tab" href="#base" role="tab" aria-controls="base" aria-selected="false">Base Icons</a>
        </li>
    </ul>
    <div class="tab-content border border-top-0" id="icon-content" style="max-height: 34rem; overflow: hidden;">
        <div class="tab-pane show active container px-0" id="alpine" role="tabpanel" aria-labelledby="alpine-tab" style="max-height: 34rem;position: relative;">
            <div class="download bg-primary p-2" style="bottom: 0; left: 0;"><a href="./resources/alpine/alpine-icons.zip">Download All</a></div>
        </div>
        <div class="tab-pane show active container px-0" id="balham" role="tabpanel" aria-labelledby="balham-tab" style="max-height: 34rem;position: relative;">
            <div class="download bg-primary p-2" style="bottom: 0; left: 0;"><a href="./resources/balham/balham-icons.zip">Download All</a></div>
        </div>
        <div class="tab-pane show active container px-0" id="balham" role="tabpanel" aria-labelledby="balham-tab" style="max-height: 34rem;position: relative;">
            <div class="download bg-primary p-2" style="bottom: 0; left: 0;"><a href="./resources/balham/balham-icons.zip">Download All</a></div>
        </div>
        <div class="tab-pane container px-0" id="material" role="tabpanel" aria-labelledby="material-tab" style="max-height: 34rem;">
            <div class="download bg-primary p-2"><a href="./resources/material/material-icons.zip">Download All</a></div>
        </div>
        <div class="tab-pane container px-0" id="base" role="tabpanel" aria-labelledby="base-tab" style="max-height: 34rem;">
            <div class="download bg-primary p-2"><a href="./resources/base/base-icons.zip">Download All</a></div>
        </div>
    </div>

<?php include '../documentation-main/documentation_footer.php';?>
