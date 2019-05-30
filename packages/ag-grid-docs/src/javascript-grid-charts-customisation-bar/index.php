<?php
$pageTitle = "Charting: Charting Grid Data";
$pageDescription = "ag-Grid is a feature-rich data grid that can also chart data out of the box. Learn how to chart data directly from inside ag-Grid.";
$pageKeyboards = "Javascript Grid Charting";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

    <h1 class="heading-enterprise">Customising Bar Charts</h1>

    <p class="lead">
        This sections details how to customise bar charts in your applications.
    </p>

    <h3>Bar Chart Option Interfaces</h3>

    <p>
        The interfaces for bar chart options are shown below:
    </p>

    <snippet>
interface BarChartOptions {
    // Container element for the chart.
    parent?: HTMLElement;
    // The width of the chart.
    width?: number;
    // The height of the chart.
    height?: number;
    // The padding of contents from the edges of the chart.
    padding?:  {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    // The side of the chart to dock the legend to.
    legendPosition?: 'top' | 'right' | 'bottom' | 'left';
    // The padding amount between the legend and the series.
    legendPadding?: number;
    // The CSS class name to be used by the tooltip element.
    tooltipClass?: string;
    legend?: {
        // The line width of a legend marker.
        markerLineWidth?: number;
        // The size of a legend marker.
        markerSize?: number;
        // The padding between a legend marker and its label.
        markerPadding?: number;
        // The amount of horizontal padding between legend items.
        itemPaddingX?: number;
        // The amount of vertical padding between legend items.
        itemPaddingY?: number;
        // The font to be used by the legend's labels.
        // Should use the same format as the shorthand `font` property in CSS.
        labelFont?: string;
        // The color to be used by the legend's labels.
        labelColor?: string;
    };
    // The horizontal chart axis.
    xAxis: AxisOptions;
    // The vertical chart axis.
    yAxis: AxisOptions;
    seriesDefaults?: {
        // Whether this series should be represented in the legend. Defaults to `true`.
        showInLegend?: boolean;
        // Whether to show the tooltip for bars when they are hovered/tapped. Defaults to `false`.
        tooltipEnabled?: boolean;
        // The fill colors to be used by the series.
        fills?: string[];
        // The stroke colors to be used by the series.
        strokes?: string[];
        // The stroke width. Defaults to `1`.
        strokeWidth?: number;
        // The shadow type to use for bars. Defaults to no shadow.
        // Note: shadows can noticeably slow down rendering of charts with a few hundred bars.
        shadow?: {
            // The shadow color. For example, 'rgba(0, 0, 0, 0.3)'.
            color?: string;
            // The shadow offset.
            offset?: [number, number];
            // The blur amount to apply.
            blur?: number;
        };
        // Whether to show the labels for bars (only applies to the stacked bars).
        labelEnabled?: boolean;
        // The font to be used by the bar labels.
        labelFont?: string;
        // The color to be used by the bar labels.
        labelColor?: string;
        // The padding of the labels within bars (from the top and sides of a bar).
        labelPadding?: {x: number, y: number};
        // A custom tooltip render to use for bar tooltips. Should return a valid HTML string.
        tooltipRenderer?: (params: BarTooltipRendererParams) => string;
    };
}

interface BarTooltipRendererParams {
    // The datum object (an element in the `data` array used by the chart/series).
    datum: any;
    // The field of the datum object that contains the category name of the highlighted bar.
    xField: string;
    // The field of the datum object that contains the series value of the highlighted bar.
    yField: string;
}

interface AxisOptions {
    // The thickness of the axis line.
    lineWidth?: number;
    // The color of the axis line. Depends on whether the light or dark mode is used.
    lineColor?: string;

    // The thickness of the ticks.
    tickWidth?: number;
    // The length of the ticks.
    tickSize?: number;
    // The padding between the ticks and the labels.
    tickPadding?: number;
    // The color of the axis ticks. Depends on whether the light or dark mode is used.
    tickColor?: string;

    // The font to be used by axis labels. Defaults to `12px Verdana, sans-serif`.
    labelFont?: string;
    // The color of the axis labels. Depends on whether the light or dark mode is used.
    labelColor?: string;
    // The rotation of the axis labels from their default value. Defaults to zero.
    labelRotation?: number;
    // The custom formatter function for the axis labels.
    // The value is either a category name or a number. If it's the latter, the number
    // of fractional digits used by the axis step will be provided as well.
    // The returned string will be used as a label.
    labelFormatter?: (value: any, fractionDigits?: number) => string;
    // The styles of the grid lines. These are repeated. If only a single style is provided,
    // it will be used for all grid lines, if two styles are provided, every style will be
    // used by every other line, and so on.
    gridStyle?: IGridStyle[];
}

interface IGridStyle {
    // The stroke color of a grid line. Depends on whether the light or dark mode is used.
    stroke?: string;
    // The line dash array. Every number in the array specifies the length of alternating
    // dashes and gaps. For example, [6, 3] means dash of length 6 and gap of length 3.
    // Defaults to `[4, 2]`.
    lineDash?: number[];
}
</snippet>


<h3>Default Bar Options</h3>

<p>
    The default values for the bar chart options are shown below:
</p>

    <snippet>{
    parent: this.chartProxyParams.parentElement,
    width: this.chartProxyParams.width,
    height: this.chartProxyParams.height,
    padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    xAxis: {
        type: 'category',
        labelFont: '12px Verdana, sans-serif',
        labelColor: this.getLabelColor(),
        tickSize: 6,
        tickWidth: 1,
        tickPadding: 5,
        lineColor: 'rgba(195, 195, 195, 1)',
        lineWidth: 1,
        gridStyle: [{
            strokeStyle: this.getAxisGridColor(),
            lineDash: [4, 2]
        }]
    },
    yAxis: {
        type: 'number',
        labelFont: '12px Verdana, sans-serif',
        labelColor: this.getLabelColor(),
        tickSize: 6,
        tickWidth: 1,
        tickPadding: 5,
        lineColor: 'rgba(195, 195, 195, 1)',
        lineWidth: 1,
        gridStyle: [{
            strokeStyle: this.getAxisGridColor(),
            lineDash: [4, 2]
        }]
    },
    legend: {
        labelFont: '12px Verdana, sans-serif',
        labelColor: this.getLabelColor(),
        itemPaddingX: 16,
        itemPaddingY: 8,
        markerPadding: 4,
        markerSize: 14,
        markerLineWidth: 1
    },
    seriesDefaults: {
        type: 'bar',
        fills: palette.fills,
        strokes: palette.strokes,
        grouped: this.chartProxyParams.chartType === ChartType.GroupedBar,
        strokeWidth: 1,
        tooltipEnabled: true,
        labelEnabled: false,
        labelFont: '12px Verdana, sans-serif',
        labelColor: this.getLabelColor(),
        labelPadding: {x: 10, y: 10},
        tooltipRenderer: undefined,
        showInLegend: true,
        title: '',
        titleEnabled: true,
        titleFont: 'bold 12px Verdana, sans-serif'
    }
}
</snippet>

    <?= example('Provided Container', 'provided-container', 'generated', array("enterprise" => true)) ?>

    <?= example('Custom Bar Chart', 'custom-bar-chart', 'generated', array("enterprise" => true)) ?>

<?php include '../documentation-main/documentation_footer.php'; ?>
