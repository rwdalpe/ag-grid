import { GridOptionsWrapper } from "../gridOptionsWrapper";
import { Column } from "../entities/column";
import { RowNode } from "../entities/rowNode";
import { Constants } from "../constants";
import { ICellRendererComp } from "../rendering/cellRenderers/iCellRenderer";
import { SuppressKeyboardEventParams } from "../entities/colDef";
import { CellComp } from "../rendering/cellComp";
import { IFrameworkOverrides } from "../interfaces/iFrameworkOverrides";
import { Promise } from "./promise";

const FUNCTION_STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const FUNCTION_ARGUMENT_NAMES = /([^\s,]+)/g;
const AG_GRID_STOP_PROPAGATION = '__ag_Grid_Stop_Propagation';

/**
 * HTML Escapes.
 */
const HTML_ESCAPES: { [id: string]: string; } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const reUnescapedHtml = /[&<>"']/g;

export class Utils {
    private static PASSIVE_EVENTS = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];
    private static OUTSIDE_ANGULAR_EVENTS = ['mouseover', 'mouseout', 'mouseenter', 'mouseleave'];

    /**
     * These variables are lazy loaded, as otherwise they try and get initialised when we are loading
     * unit tests and we don't have references to window or document in the unit tests
     * from http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
     */
    private static isSafari: boolean;
    private static isIE: boolean;
    private static isEdge: boolean;
    private static isChrome: boolean;
    private static isFirefox: boolean;

    private static isIOS: boolean;

    private static PRINTABLE_CHARACTERS = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890!"£$%^&*()_+-=[];\'#,./\\|<>?:@~{}';

    private static NUMPAD_DEL_NUMLOCK_ON_KEY = 'Del';
    private static NUMPAD_DEL_NUMLOCK_ON_CHARCODE = 46;

    private static doOnceFlags: { [key: string]: boolean; } = {};
    private static supports: { [key: string]: boolean; } = {};

    /**
     * If the key was passed before, then doesn't execute the func
     * @param {Function} func
     * @param {string} key
     */
    static doOnce(func: () => void, key: string) {
        if (this.doOnceFlags[key]) { return; }

        func();
        this.doOnceFlags[key] = true;
    }

    static getMaxSafeInteger(): number {
        // eslint-disable-next-line
        if (!Number.MAX_SAFE_INTEGER) {
            return 9007199254740991;
        }
        // eslint-disable-next-line
        return Number.MAX_SAFE_INTEGER;
    }

    static isEventSupported = (() => {
        const tags = {
            select: 'input',
            change: 'input',
            submit: 'form',
            reset: 'form',
            error: 'img',
            load: 'img',
            abort: 'img'
        } as any;

        const isEventSupported = (eventName: any) => {
            if (typeof Utils.supports[eventName] === 'boolean') {
                return Utils.supports[eventName];
            }

            let el = document.createElement(tags[eventName] || 'div');
            eventName = 'on' + eventName;

            let isSupported = (eventName in el);

            if (!isSupported) {
                el.setAttribute(eventName, 'return;');
                isSupported = typeof el[eventName] == 'function';
            }
            el = null;

            return Utils.supports[eventName] = isSupported;
        };

        return isEventSupported;
    })();

    /**
     * Checks if event was issued by a left click
     * from https://stackoverflow.com/questions/3944122/detect-left-mouse-button-press
     * @param {MouseEvent} mouseEvent
     * @returns {boolean}
     */
    static isLeftClick(mouseEvent: MouseEvent): boolean {
        if ("buttons" in mouseEvent) { return mouseEvent.buttons == 1; }

        const button = (mouseEvent as any).which || (mouseEvent as any).button;

        return button == 1;
    }

    /**
     * `True` if the event is close to the original event by X pixels either vertically or horizontally.
     * we only start dragging after X pixels so this allows us to know if we should start dragging yet.
     * @param {MouseEvent | TouchEvent} e1
     * @param {MouseEvent | TouchEvent} e2
     * @param {number} pixelCount
     * @returns {boolean}
     */
    static areEventsNear(e1: MouseEvent | Touch, e2: MouseEvent | Touch, pixelCount: number): boolean {
        // by default, we wait 4 pixels before starting the drag
        if (pixelCount === 0) { return false; }

        const diffX = Math.abs(e1.clientX - e2.clientX);
        const diffY = Math.abs(e1.clientY - e2.clientY);

        return Math.max(diffX, diffY) <= pixelCount;
    }

    static jsonEquals(val1: any, val2: any): boolean {
        const val1Json = val1 ? JSON.stringify(val1) : null;
        const val2Json = val2 ? JSON.stringify(val2) : null;

        return val1Json === val2Json;
    }

    static shallowCompare(arr1: any[], arr2: any[]): boolean {
        // if both are missing, then they are the same
        if (this.missing(arr1) && this.missing(arr2)) { return true; }

        // if one is present, but other is missing, then they are different
        if (this.missing(arr1) || this.missing(arr2)) { return false; }

        if (arr1.length !== arr2.length) { return false; }

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

    static getNameOfClass(theClass: any) {
        const funcNameRegex = /function (.{1,})\(/;
        const funcAsString = theClass.toString();
        const results = funcNameRegex.exec(funcAsString);

        return results && results.length > 1 ? results[1] : "";
    }

    static areEqual<T>(a: T[], b: T[]): boolean {
        return a.length === b.length && a.every((value, index) => b[index] === value);
    }

    static keys<T>(map: Map<T, any>): T[] {
        const keys: T[] = [];

        map.forEach((_, key) => keys.push(key));

        return keys;
    }

    static values = <T>(object: { [key: string]: T; }): T[] => Object.keys(object).map(key => object[key]);

    static includes = <T>(array: T[], value: T): boolean => array.indexOf(value) > -1;

    static getValueUsingField(data: any, field: string, fieldContainsDots: boolean): any {
        if (!field || !data) { return; }

        // if no '.', then it's not a deep value
        if (!fieldContainsDots) {
            return data[field];
        }

        // otherwise it is a deep value, so need to dig for it
        const fields = field.split('.');
        let currentObject = data;

        for (let i = 0; i < fields.length; i++) {
            currentObject = currentObject[fields[i]];

            if (this.missing(currentObject)) {
                return null;
            }
        }

        return currentObject;
    }

    static getElementSize(el: HTMLElement): {
        height: number,
        width: number,
        paddingTop: number,
        paddingRight: number,
        paddingBottom: number,
        paddingLeft: number,
        marginTop: number,
        marginRight: number,
        marginBottom: number,
        marginLeft: number,
        boxSizing: string;
    } {
        const {
            height,
            width,
            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            boxSizing
        } = window.getComputedStyle(el);

        return {
            height: parseFloat(height),
            width: parseFloat(width),
            paddingTop: parseFloat(paddingTop),
            paddingRight: parseFloat(paddingRight),
            paddingBottom: parseFloat(paddingBottom),
            paddingLeft: parseFloat(paddingLeft),
            marginTop: parseFloat(marginTop),
            marginRight: parseFloat(marginRight),
            marginBottom: parseFloat(marginBottom),
            marginLeft: parseFloat(marginLeft),
            boxSizing
        };
    }

    static getInnerHeight(el: HTMLElement): number {
        const size = this.getElementSize(el);

        if (size.boxSizing === 'border-box') {
            return size.height - size.paddingTop - size.paddingBottom;
        }

        return size.height;
    }

    static getInnerWidth(el: HTMLElement): number {
        const size = this.getElementSize(el);

        if (size.boxSizing === 'border-box') {
            return size.width - size.paddingLeft - size.paddingRight;
        }

        return size.width;
    }

    static getAbsoluteHeight(el: HTMLElement): number {
        const size = this.getElementSize(el);
        const marginRight = size.marginBottom + size.marginTop;

        return Math.ceil(el.offsetHeight + marginRight);
    }

    static getAbsoluteWidth(el: HTMLElement): number {
        const size = this.getElementSize(el);
        const marginWidth = size.marginLeft + size.marginRight;

        return Math.ceil(el.offsetWidth + marginWidth);
    }

    static getScrollLeft(element: HTMLElement, rtl: boolean): number {
        let scrollLeft = element.scrollLeft;

        if (rtl) {
            // Absolute value - for FF that reports RTL scrolls in negative numbers
            scrollLeft = Math.abs(scrollLeft);

            // Get Chrome to return the same value as well
            if (this.isBrowserChrome()) {
                scrollLeft = element.scrollWidth - element.clientWidth - scrollLeft;
            }
        }

        return scrollLeft;
    }

    static cleanNumber(value: any): number {
        if (typeof value === 'string') {
            value = parseInt(value, 10);
        }
        if (typeof value === 'number') {
            value = Math.floor(value);
        } else {
            value = null;
        }

        return value;
    }

    static compose(...fns: Function[]) {
        return (arg: any) => fns.reduce((composed, f) => f(composed), arg);
    }

    static decToHex(number: number, bytes: number): string {
        let hex = '';

        for (let i = 0; i < bytes; i++) {
            hex += String.fromCharCode(number & 0xff);
            number >>>= 8;
        }

        return hex;
    }

    /**
     * It encodes any string in UTF-8 format
     * taken from https://github.com/mathiasbynens/utf8.js
     * @param {string} s
     * @returns {string}
     */
    static utf8_encode(s: string): string {
        const stringFromCharCode = String.fromCharCode;

        function ucs2decode(string: string) {
            const output = [];
            let counter = 0;
            const length = string.length;
            let value;
            let extra;

            while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                    // high surrogate, and there is a next character
                    extra = string.charCodeAt(counter++);
                    if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                    } else {
                        // unmatched surrogate; only append this code unit, in case the next
                        // code unit is the high surrogate of a surrogate pair
                        output.push(value);
                        counter--;
                    }
                } else {
                    output.push(value);
                }
            }
            return output;
        }

        function checkScalarValue(codePoint: number) {
            if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
                throw Error(
                    'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
                    ' is not a scalar value'
                );
            }
        }

        function createByte(codePoint: number, shift: number) {
            return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
        }

        function encodeCodePoint(codePoint: number) {
            if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
                return stringFromCharCode(codePoint);
            }
            let symbol = '';

            if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
                symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
            } else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
                checkScalarValue(codePoint);
                symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
                symbol += createByte(codePoint, 6);
            } else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
                symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
                symbol += createByte(codePoint, 12);
                symbol += createByte(codePoint, 6);
            }
            symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
            return symbol;
        }

        const codePoints = ucs2decode(s);
        const length = codePoints.length;
        let index = -1;
        let codePoint;
        let byteString = '';

        while (++index < length) {
            codePoint = codePoints[index];
            byteString += encodeCodePoint(codePoint);
        }

        return byteString;
    }

    static setScrollLeft(element: HTMLElement, value: number, rtl: boolean): void {
        if (rtl) {
            // Chrome and Safari when doing RTL have the END position of the scroll as zero, not the start
            if (this.isBrowserSafari() || this.isBrowserChrome()) {
                value = element.scrollWidth - element.clientWidth - value;
            }
            // Firefox uses negative numbers when doing RTL scrolling
            if (this.isBrowserFirefox()) {
                value *= -1;
            }
        }
        element.scrollLeft = value;
    }

    static iterateNamedNodeMap(map: NamedNodeMap, callback: (key: string, value: string) => void): void {
        if (!map) { return; }

        for (let i = 0; i < map.length; i++) {
            const attr = map[i];
            callback(attr.name, attr.value);
        }
    }

    static iterateObject<T>(object: { [p: string]: T; } | T[] | undefined, callback: (key: string, value: T) => void) {
        if (!object || this.missing(object)) { return; }

        if (Array.isArray(object)) {
            object.forEach((value, index) => callback(`${index}`, value));
        } else {
            Object.keys(object).forEach(key => callback(key, object[key]));
        }
    }

    static cloneObject<T>(object: T): T {
        const copy = {} as T;
        const keys = Object.keys(object);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = (object as any)[key];
            (copy as any)[key] = value;
        }

        return copy;
    }

    static deepCloneObject<T>(object: T): T {
        return JSON.parse(JSON.stringify(object));
    }

    static getProperty = <T, K extends keyof T>(object: T, key: K): any => object[key];
    static setProperty = <T, K extends keyof T>(object: T, key: K, value: any): void => object[key] = value;

    /**
     * Will copy the specified properties from `source` into the equivalent properties on `target`, ignoring properties with
     * a value of `undefined`.
     */
    static copyPropertiesIfPresent<S, T extends S, K extends keyof S>(source: S, target: T, ...properties: K[]) {
        properties.forEach(p => this.copyPropertyIfPresent(source, target, p));
    }

    /**
     * Will copy the specified property from `source` into the equivalent property on `target`, unless the property has a
     * value of `undefined`. If a transformation is provided, it will be applied to the value before being set on `target`.
     */
    static copyPropertyIfPresent<S, T extends S, K extends keyof S>(source: S, target: T, property: K, transform?: (value: S[K]) => any) {
        const value = this.getProperty(source, property);

        if (value !== undefined) {
            this.setProperty(target, property, transform ? transform(value) : value);
        }
    }

    static getAllKeysInObjects(objects: any[]): string[] {
        const allValues: any = {};

        objects.forEach(obj => {
            if (obj) {
                Object.keys(obj).forEach(key => allValues[key] = null);
            }
        });

        return Object.keys(allValues);
    }

    static mergeDeep(dest: any, source: any, copyUndefined = true): void {
        if (!this.exists(source)) { return; }

        this.iterateObject(source, (key: string, newValue: any) => {
            const oldValue: any = dest[key];

            if (oldValue === newValue) { return; }

            if (typeof oldValue === 'object' && typeof newValue === 'object' && !Array.isArray(oldValue)) {
                Utils.mergeDeep(oldValue, newValue);
            } else if (copyUndefined || newValue !== undefined) {
                dest[key] = newValue;
            }
        });
    }

    static assign(object: any, ...sources: any[]): any {
        sources.forEach(source => {
            if (this.exists(source)) {
                this.iterateObject(source, function(key: string, value: any) {
                    object[key] = value;
                });
            }
        });

        return object;
    }

    static flatten(arrayOfArrays: any[]) {
        return [].concat.apply([], arrayOfArrays);
    }

    static parseYyyyMmDdToDate(yyyyMmDd: string, separator: string): Date | null {
        try {
            if (!yyyyMmDd) { return null; }

            if (yyyyMmDd.indexOf(separator) === -1) { return null; }

            const fields: string[] = yyyyMmDd.split(separator);

            if (fields.length != 3) { return null;  }

            return new Date(Number(fields[0]), Number(fields[1]) - 1, Number(fields[2]));
        } catch (e) {
            return null;
        }
    }

    static serializeDateToYyyyMmDd(date: Date, separator: string): string | null {
        if (!date) { return null; }

        return date.getFullYear() + separator + this.padStart(date.getMonth() + 1, 2) + separator + this.padStart(date.getDate(), 2);
    }

    static getTimeFromDate(date: Date): string | null {
        if (!date) { return null; }

        return `${this.padStart(date.getHours(), 2)}:${this.padStart(date.getMinutes(), 2)}:${this.padStart(date.getSeconds(), 2)}`;
    }

    static normalizeTime(time: string): string {
        if (!time) { return '00:00:00'; }

        let hoursStr = '00';
        let minutesStr = '00';
        let secondsStr = '00';

        const [ hours, minutes, seconds ] = time.split(':').map(Number);

        if (hours >= 0 && hours <= 24) {
            hoursStr = _.padStart(hours, 2);
        }

        if (minutes >= 0 && minutes <= 59) {
            minutesStr = _.padStart(minutes, 2);
        }

        if (seconds >= 0 && seconds <= 59) {
            secondsStr = _.padStart(seconds, 2);
        }

        return `${hoursStr}:${minutesStr}:${secondsStr}`;
    }

    static padStart(num: number, totalStringSize: number): string {
        let asString: string = `${num}`;

        while (asString.length < totalStringSize) {
            asString = `0${asString}`;
        }

        return asString;
    }

    static pushAll(target: any[], source: any[]): void {
        if (this.missing(source) || this.missing(target)) { return; }

        source.forEach(func => target.push(func));
    }

    static createArrayOfNumbers(first: number, last: number): number[] {
        const result: number[] = [];

        for (let i = first; i <= last; i++) {
            result.push(i);
        }

        return result;
    }

    static getFunctionParameters(func: any) {
        const fnStr = func.toString().replace(FUNCTION_STRIP_COMMENTS, '');
        const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(FUNCTION_ARGUMENT_NAMES);

        if (result === null) { return []; }

        return result;
    }

    static find<T>(collection: T[] | { [id: string]: T; }, predicate: string | boolean | ((item: T) => boolean), value?: any): T | null {
        if (collection === null || collection === undefined) { return null; }

        if (!Array.isArray(collection)) {
            const objToArray = this.values(collection);
            return this.find(objToArray, predicate, value);
        }

        const collectionAsArray = collection as T[];

        let firstMatchingItem: T | null = null;
        for (let i = 0; i < collectionAsArray.length; i++) {
            const item: T = collectionAsArray[i];

            if (typeof predicate === 'string') {
                if ((item as any)[predicate] === value) {
                    firstMatchingItem = item;
                    break;
                }
            } else {
                const callback = predicate as (item: T) => boolean;
                if (callback(item)) {
                    firstMatchingItem = item;
                    break;
                }
            }
        }

        return firstMatchingItem;
    }

    static toStrings<T>(array: T[]): (string | null)[] {
        return array.map(item => {
            if (item === undefined || item === null || !item.toString) {
                return null;
            }

            return item.toString();
        });
    }

    static findIndex<T>(collection: T[], predicate: (item: T, idx: number, collection: T[]) => boolean): number {
        for (let i = 0; i < collection.length; i++) {
            if (predicate(collection[i], i, collection)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Returns true if it is a DOM node
     * taken from: http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
     * @param {any} o
     * @return {boolean}
     */
    static isNode(o: any): boolean {
        return (
            typeof Node === "function"
                ? o instanceof Node
                : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
    }

    //
    /**
     * Returns true if it is a DOM element
     * taken from: http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
     * @param {any} o
     * @returns {boolean}
     */
    static isElement(o: any): boolean {
        return (
            typeof HTMLElement === "function"
                ? o instanceof HTMLElement //DOM2
                : o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
        );
    }

    static isNodeOrElement(o: any) {
        return this.isNode(o) || this.isElement(o);
    }

    /**
     * Makes a copy of a node list into a list
     * @param {NodeList} nodeList
     * @returns {Node[]}
     */
    static copyNodeList(nodeList: NodeList): Node[] {
        const childCount = nodeList ? nodeList.length : 0;
        const res: Node[] = [];

        for (let i = 0; i < childCount; i++) {
            res.push(nodeList[i]);
        }

        return res;
    }

    static isEventFromPrintableCharacter(event: KeyboardEvent): boolean {
        const pressedChar = String.fromCharCode(event.charCode);

        // newline is an exception, as it counts as a printable character, but we don't
        // want to start editing when it is pressed. without this check, if user is in chrome
        // and editing a cell, and they press ctrl+enter, the cell stops editing, and then
        // starts editing again with a blank value (two 'key down' events are fired). to
        // test this, remove the line below, edit a cell in chrome and hit ctrl+enter while editing.
        // https://ag-grid.atlassian.net/browse/AG-605
        if (this.isKeyPressed(event, Constants.KEY_NEW_LINE)) { return false; }

        // no allowed printable chars have alt or ctrl key combinations
        if (event.altKey || event.ctrlKey) { return false; }

        if (_.exists(event.key)) {
            // modern browser will implement key, so we return if key is length 1, eg if it is 'a' for the
            // a key, or '2' for the '2' key. non-printable characters have names, eg 'Enter' or 'Backspace'.
            const printableCharacter = event.key.length === 1;

            // IE11 & Edge treat the numpad del key differently - with numlock on we get "Del" for key,
            // so this addition checks if its IE11/Edge and handles that specific case the same was as all other browsers
            const numpadDelWithNumlockOnForEdgeOrIe = Utils.isNumpadDelWithNumlockOnForEdgeOrIe(event);

            return printableCharacter || numpadDelWithNumlockOnForEdgeOrIe;
        }

        // otherwise, for older browsers, we test against a list of characters, which doesn't include
        // accents for non-English, but don't care much, as most users are on modern browsers
        return Utils.PRINTABLE_CHARACTERS.indexOf(pressedChar) >= 0;
    }

    /**
     * Allows user to tell the grid to skip specific keyboard events
     * @param {GridOptionsWrapper} gridOptionsWrapper
     * @param {KeyboardEvent} keyboardEvent
     * @param {RowNode} rowNode
     * @param {Column} column
     * @param {boolean} editing
     * @returns {boolean}
     */
    static isUserSuppressingKeyboardEvent(
        gridOptionsWrapper: GridOptionsWrapper,
        keyboardEvent: KeyboardEvent,
        rowNode: RowNode,
        column: Column,
        editing: boolean
    ): boolean {

        const gridOptionsFunc = gridOptionsWrapper.getSuppressKeyboardEventFunc();
        const colDefFunc = column.getColDef().suppressKeyboardEvent;

        // if no callbacks provided by user, then do nothing
        if (!gridOptionsFunc && !colDefFunc) { return false; }

        const params: SuppressKeyboardEventParams = {
            event: keyboardEvent,
            editing,
            column,
            api: gridOptionsWrapper.getApi(),
            node: rowNode,
            data: rowNode.data,
            colDef: column.getColDef(),
            context: gridOptionsWrapper.getContext(),
            columnApi: gridOptionsWrapper.getColumnApi()
        };

        // colDef get first preference on suppressing events
        if (colDefFunc) {
            const colDefFuncResult = colDefFunc(params);
            // if colDef func suppressed, then return now, no need to call gridOption func
            if (colDefFuncResult) { return true; }
        }

        if (gridOptionsFunc) {
            // if gridOption func, return the result
            return gridOptionsFunc(params);
        }

        // otherwise return false, don't suppress, as colDef didn't suppress and no func on gridOptions
        return false;
    }

    static getCellCompForEvent(gridOptionsWrapper: GridOptionsWrapper, event: Event): CellComp {
        let sourceElement = this.getTarget(event);

        while (sourceElement) {
            const renderedCell = gridOptionsWrapper.getDomData(sourceElement, 'cellComp');
            if (renderedCell) {
                return renderedCell as CellComp;
            }
            sourceElement = sourceElement.parentElement;
        }

        return null;
    }

    /**
     * Adds all type of change listeners to an element, intended to be a text field
     * @param {HTMLElement} element
     * @param {EventListener} listener
     */
    static addChangeListener(element: HTMLElement, listener: EventListener) {
        element.addEventListener("changed", listener);
        element.addEventListener("paste", listener);
        element.addEventListener("input", listener);
        // IE doesn't fire changed for special keys (eg delete, backspace), so need to
        // listen for this further ones
        element.addEventListener("keydown", listener);
        element.addEventListener("keyup", listener);
    }

    /**
     * If value is undefined, null or blank, returns null, otherwise returns the value
     * @param {T} value
     * @returns {T | null}
     */
    static makeNull<T>(value: T): T | null {
        const valueNoType = value as any;

        if (value === null || value === undefined || valueNoType === "") {
            return null;
        }

        return value;
    }

    static missing(value: any): boolean {
        return !this.exists(value);
    }

    static missingOrEmpty(value: any[] | string | undefined): boolean {
        return !value || this.missing(value) || value.length === 0;
    }

    static missingOrEmptyObject(value: any): boolean {
        return this.missing(value) || Object.keys(value).length === 0;
    }

    static exists(value: any, allowEmptyString: boolean = false): boolean {
        return value != null && (value !== '' || allowEmptyString);
    }

    static firstExistingValue<A>(...values: A[]): A | null {
        for (let i = 0; i < values.length; i++) {
            const value: A = values[i];
            if (_.exists(value)) {
                return value;
            }
        }

        return null;
    }

    static anyExists(values: any[]): boolean {
        if (values) {
            for (let i = 0; i < values.length; i++) {
                if (this.exists(values[i])) {
                    return true;
                }
            }
        }

        return false;
    }

    static existsAndNotEmpty(value?: any[] | null): boolean {
        return value != null && this.exists(value) && value.length > 0;
    }

    static clearElement(el: HTMLElement): void {
        while (el && el.firstChild) { el.removeChild(el.firstChild); }
    }

    static removeElement(parent: HTMLElement, cssSelector: string) {
        this.removeFromParent(parent.querySelector(cssSelector));
    }

    static removeFromParent(node: Element | null) {
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    static isVisible(element: HTMLElement) {
        return (element.offsetParent !== null);
    }

    static callIfPresent(func: Function): void {
        if (func) { func(); }
    }

    /**
     * Loads the template and returns it as an element. makes up for no simple way in
     * the dom api to load html directly, eg we cannot do this: document.createElement(template)
     * @param {string} template
     * @returns {HTMLElement}
     */
    static loadTemplate(template: string): HTMLElement {
        const tempDiv = document.createElement("div");

        tempDiv.innerHTML = template;
        return tempDiv.firstChild as HTMLElement;
    }

    static appendHtml(eContainer: HTMLElement, htmlTemplate: string) {
        if (eContainer.lastChild) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
            // we put the items at the start, so new items appear underneath old items,
            // so when expanding/collapsing groups, the new rows don't go on top of the
            // rows below that are moving our of the way
            eContainer.insertAdjacentHTML('afterbegin', htmlTemplate);
        } else {
            eContainer.innerHTML = htmlTemplate;
        }
    }

    static addOrRemoveCssClass(element: HTMLElement, className: string, addOrRemove: boolean) {
        if (addOrRemove) {
            this.addCssClass(element, className);
        } else {
            this.removeCssClass(element, className);
        }
    }

    /**
     * This method adds a class to an element and remove that class from all siblings.
     * Useful for toggling state.
     * @param {HTMLElement} element The element to receive the class
     * @param {string} elementClass The class to be assigned to the element
     * @param {boolean} otherElementClass The class to be assigned to siblings of the element, but not the element itself
     */
    static radioCssClass(element: HTMLElement, elementClass: string | null, otherElementClass?: string | null) {
        const parent = element.parentElement;
        let sibling = parent.firstChild as HTMLElement;

        while (sibling) {
            if (elementClass) {
                _.addOrRemoveCssClass(sibling, elementClass, sibling === element);
            }
            if (otherElementClass) {
                _.addOrRemoveCssClass(sibling, otherElementClass, sibling !== element);
            }
            sibling = sibling.nextSibling as HTMLElement;
        }
    }

    static addCssClass(element: HTMLElement, className: string) {
        if (!className || className.length === 0) { return; }

        if (className.indexOf(' ') >= 0) {
            className.split(' ').forEach(value => this.addCssClass(element, value));
            return;
        }

        if (element.classList) {
            element.classList.add(className);
        } else if (element.className && element.className.length > 0) {
            const cssClasses = element.className.split(' ');

            if (cssClasses.indexOf(className) < 0) {
                cssClasses.push(className);
                element.setAttribute('class', cssClasses.join(' '));
            }
        } else {
            // do not use element.classList = className here, it will cause
            // a read-only assignment error on some browsers (IE/Edge).
            element.setAttribute('class', className);
        }

        return element;
    }

    static removeCssClass(element: HTMLElement, className: string) {
        if (element.classList) {
            element.classList.remove(className);
        } else if (element.className && element.className.length > 0) {
            const newClassName = element.className.split(' ').filter(c => c !== className).join(' ');

            element.setAttribute('class', newClassName);
        }
    }

    static containsClass(element: any, className: string): boolean {
        if (element.classList) {
            // for modern browsers
            return element.classList.contains(className);
        }

        if (element.className) {
            // for older browsers, check against the string of class names
            // if only one class, can check for exact match
            const onlyClass = element.className === className;
            // if many classes, check for class name, we have to pad with ' ' to stop other
            // class names that are a substring of this class
            const contains = element.className.indexOf(' ' + className + ' ') >= 0;
            // the padding above then breaks when it's the first or last class names
            const startsWithClass = element.className.indexOf(className + ' ') === 0;
            const endsWithClass = element.className.lastIndexOf(' ' + className) === (element.className.length - className.length - 1);

            return onlyClass || contains || startsWithClass || endsWithClass;
        }

        // if item is not a node
        return false;
    }

    static getElementAttribute(element: any, attributeName: string): string | null {
        if (element.attributes && element.attributes[attributeName]) {
            const attribute = element.attributes[attributeName];

            return attribute.value;
        }

        return null;
    }

    static offsetHeight(element: HTMLElement) {
        return element && element.clientHeight ? element.clientHeight : 0;
    }

    static offsetWidth(element: HTMLElement) {
        return element && element.clientWidth ? element.clientWidth : 0;
    }

    static sortNumerically(array: number[]): number[] {
        return array.sort((a, b) => a - b);
    }

    static removeRepeatsFromArray<T>(array: T[], object: T) {
        if (!array) { return; }

        for (let index = array.length - 2; index >= 0; index--) {
            const thisOneMatches = array[index] === object;
            const nextOneMatches = array[index + 1] === object;

            if (thisOneMatches && nextOneMatches) {
                array.splice(index + 1, 1);
            }
        }
    }

    static removeFromArray<T>(array: T[], object: T) {
        const index = array.indexOf(object);

        if (index >= 0) {
            array.splice(index, 1);
        }
    }

    static removeAllFromArray<T>(array: T[], toRemove: T[]) {
        toRemove.forEach(item => this.removeFromArray(array, item));
    }

    static insertIntoArray<T>(array: T[], object: T, toIndex: number) {
        array.splice(toIndex, 0, object);
    }

    static insertArrayIntoArray<T>(dest: T[], src: T[], toIndex: number) {
        if (this.missing(dest) || this.missing(src)) { return; }
        // put items in backwards, otherwise inserted items end up in reverse order

        for (let i = src.length - 1; i >= 0; i--) {
            const item = src[i];
            this.insertIntoArray(dest, item, toIndex);
        }
    }

    static moveInArray<T>(array: T[], objectsToMove: T[], toIndex: number) {
        // first take out it items from the array
        objectsToMove.forEach((obj) => {
            this.removeFromArray(array, obj);
        });

        // now add the objects, in same order as provided to us, that means we start at the end
        // as the objects will be pushed to the right as they are inserted
        objectsToMove.slice().reverse().forEach((obj) => {
            this.insertIntoArray(array, obj, toIndex);
        });
    }

    static defaultComparator(valueA: any, valueB: any, accentedCompare: boolean = false): number {
        const valueAMissing = valueA === null || valueA === undefined;
        const valueBMissing = valueB === null || valueB === undefined;

        function doQuickCompare(a: string, b: string): number {
            return (a > b ? 1 : (a < b ? -1 : 0));
        }

        // this is for aggregations sum and avg, where the result can be a number that is wrapped.
        // if we didn't do this, then the toString() value would be used, which would result in
        // the strings getting used instead of the numbers.
        if (valueA && valueA.toNumber) {
            valueA = valueA.toNumber();
        }

        if (valueB && valueB.toNumber) {
            valueB = valueB.toNumber();
        }

        if (valueAMissing && valueBMissing) {
            return 0;
        }

        if (valueAMissing) {
            return -1;
        }

        if (valueBMissing) {
            return 1;
        }

        if (typeof valueA === "string") {
            if (!accentedCompare) {
                return doQuickCompare(valueA, valueB);
            }

            try {
                // using local compare also allows chinese comparisons
                return valueA.localeCompare(valueB);
            } catch (e) {
                // if something wrong with localeCompare, eg not supported
                // by browser, then just continue with the quick one
                return doQuickCompare(valueA, valueB);
            }
        }

        if (valueA < valueB) {
            return -1;
        } else if (valueA > valueB) {
            return 1;
        }

        return 0;
    }

    static last<T>(arr: T[]): T | undefined {
        if (!arr || !arr.length) { return undefined; }

        return arr[arr.length - 1];
    }

    static compareArrays(array1: any[] | undefined, array2: any[]): boolean {
        if (this.missing(array1) && this.missing(array2)) {
            return true;
        }

        if ((this.missing(array1) || this.missing(array2)) ||
            (!array1 || !array2)) {
            return false;
        }

        if (array1.length !== array2.length) {
            return false;
        }

        for (let i = 0; i < array1.length; i++) {
            if (array1[i] !== array2[i]) {
                return false;
            }
        }

        return true;
    }

    static ensureDomOrder(eContainer: HTMLElement, eChild: HTMLElement, eChildBefore: HTMLElement): void {
        // if already in right order, do nothing
        if (eChildBefore && eChildBefore.nextSibling === eChild) {
            return;
        }

        if (eChildBefore) {
            if (eChildBefore.nextSibling) {
                // insert between the eRowBefore and the row after it
                eContainer.insertBefore(eChild, eChildBefore.nextSibling);
            } else {
                // if nextSibling is missing, means other row is at end, so just append new row at the end
                eContainer.appendChild(eChild);
            }
        } else {
            // otherwise put at start
            if (eContainer.firstChild && eContainer.firstChild !== eChild) {
                // insert it at the first location
                eContainer.insertAdjacentElement('afterbegin', eChild);
            }
        }
    }

    static setDomChildOrder(eContainer: HTMLElement, orderedChildren: HTMLElement[]): void {
        for (let i = 0; i < orderedChildren.length; i++) {
            const correctCellAtIndex = orderedChildren[i];
            const actualCellAtIndex = eContainer.children[i];

            if (actualCellAtIndex !== correctCellAtIndex) {
                eContainer.insertBefore(correctCellAtIndex, actualCellAtIndex);
            }
        }
    }

    static insertTemplateWithDomOrder(
        eContainer: HTMLElement,
        htmlTemplate: string,
        eChildBefore: HTMLElement
    ): HTMLElement {
        let res: HTMLElement;

        if (eChildBefore) {
            // if previous element exists, just slot in after the previous element
            eChildBefore.insertAdjacentHTML('afterend', htmlTemplate);
            res = eChildBefore.nextSibling as HTMLElement;
        } else {
            if (eContainer.firstChild) {
                // insert it at the first location
                eContainer.insertAdjacentHTML('afterbegin', htmlTemplate);
            } else {
                // otherwise eContainer is empty, so just append it
                eContainer.innerHTML = htmlTemplate;
            }
            res = eContainer.firstChild as HTMLElement;
        }
        return res;
    }

    static every<T>(items: T[], callback: (item: T) => boolean): boolean {
        if (!items || items.length === 0) {
            return true;
        }

        for (let i = 0; i < items.length; i++) {
            if (!callback(items[i])) {
                return false;
            }
        }

        return true;
    }

    static toStringOrNull(value: any): string | null {
        if (this.exists(value) && value.toString) {
            return value.toString();
        }

        return null;
    }

    static formatSize(size: number | string) {
        if (typeof size === "number") {
            return `${size}px`;
        }

        return size;
    }

    static formatNumberTwoDecimalPlacesAndCommas(value: number | null): string {
        if (typeof value !== 'number') { return ''; }

        // took this from: http://blog.tompawlak.org/number-currency-formatting-javascript
        return (Math.round(value * 100) / 100).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }

    static findLineByLeastSquares(values: number[]) {
        const len = values.length;

        if (len <= 1) { return values; }

        let sum_x = 0;
        let sum_y = 0;
        let sum_xy = 0;
        let sum_xx = 0;

        let y = 0;

        for (let x = 0; x < len; x++) {
            y = values[x];
            sum_x += x;
            sum_y += y;
            sum_xx += x * x;
            sum_xy += x * y;
        }

        const m = (len * sum_xy - sum_x * sum_y) / (len * sum_xx - sum_x * sum_x);
        const b = (sum_y / len) - (m * sum_x) / len;

        const result = [];

        for (let x = 0; x <= len; x++) {
            result.push(x * m + b);
        }

        return result;
    }

    /**
     * the native method number.toLocaleString(undefined, {minimumFractionDigits: 0})
     * puts in decimal places in IE, so we use this method instead
     * from: http://blog.tompawlak.org/number-currency-formatting-javascript
     * @param {number} value
     * @returns {string}
     */
    static formatNumberCommas(value: number): string {
        if (typeof value !== 'number') { return ''; }

        return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }

    static prependDC(parent: HTMLElement, documentFragment: DocumentFragment): void {
        if (this.exists(parent.firstChild)) {
            parent.insertBefore(documentFragment, parent.firstChild);
        } else {
            parent.appendChild(documentFragment);
        }
    }

    //
    // IMPORTANT NOTE!
    //
    // If you change the list below, copy/paste the new content into the docs page javascript-grid-icons
    //
    static iconNameClassMap: { [key: string]: string; } = {
        // header column group shown when expanded (click to contract)
        columnGroupOpened: 'expanded',
        // header column group shown when contracted (click to expand)
        columnGroupClosed: 'contracted',
        // tool panel column group contracted (click to expand)
        columnSelectClosed: 'tree-closed',
        // tool panel column group expanded (click to contract)
        columnSelectOpen: 'tree-open',
        // column tool panel header expand/collapse all button, shown when some children are expanded and
        //     others are collapsed
        columnSelectIndeterminate: 'tree-indeterminate',
        // shown on ghost icon while dragging column to the side of the grid to pin
        columnMovePin: 'pin',
        // shown on ghost icon while dragging over part of the page that is not a drop zone
        columnMoveHide: 'eye-slash',
        // shown on ghost icon while dragging columns to reorder
        columnMoveMove: 'arrows',
        // animating icon shown when dragging a column to the right of the grid causes horizontal scrolling
        columnMoveLeft: 'left',
        // animating icon shown when dragging a column to the left of the grid causes horizontal scrolling
        columnMoveRight: 'right',
        // shown on ghost icon while dragging over Row Groups drop zone
        columnMoveGroup: 'group',
        // shown on ghost icon while dragging over Values drop zone
        columnMoveValue: 'aggregation',
        // shown on ghost icon while dragging over pivot drop zone
        columnMovePivot: 'pivot',
        // shown on ghost icon while dragging over drop zone that doesn't support it, e.g.
        //     string column over aggregation drop zone
        dropNotAllowed: 'not-allowed',
        // shown on row group when contracted (click to expand)
        groupContracted: 'tree-closed',
        // shown on row group when expanded (click to contract)
        groupExpanded: 'tree-open',
        // context menu chart item
        chart: 'chart',
        // chart window title bar
        close: 'cross',
        // X (remove) on column 'pill' after adding it to a drop zone list
        cancel: 'cancel',
        // indicates the currently active pin state in the "Pin column" sub-menu of the column menu
        check: 'tick',
        // the following checkbox-* items are for checkboxes on themes that don't use a
        //     native <input type="radio">
        checkboxChecked: 'checkbox-checked',
        checkboxUnchecked: 'checkbox-unchecked',
        checkboxIndeterminate: 'checkbox-indeterminate',
        // "go to first" button in pagination controls
        first: 'first',
        // "go to previous" button in pagination controls
        previous: 'previous',
        // "go to next" button in pagination controls
        next: 'next',
        // "go to last" button in pagination controls
        last: 'last',
        // shown on top right of chart when chart is linked to range data (click to unlink)
        linked: 'linked',
        // shown on top right of chart when chart is not linked to range data (click to link)
        unlinked: 'unlinked',
        // "Choose colour" button on chart settings tab
        colorPicker: 'color-picker',
        // the following radio-button-* items are for radio buttons on themes that don't use a
        //     native <input type="radio">
        radioButtonOn: 'radio-button-on',
        radioButtonOff: 'radio-button-off',
        // rotating spinner shown by the loading cell renderer
        groupLoading: 'loading',
        // button to launch enterprise column menu
        menu: 'menu',
        // filter tool panel tab
        filter: 'filter',
        // column tool panel tab
        columns: 'columns',
        // button in chart regular size window title bar (click to maximise)
        maximize: 'maximize',
        // button in chart maximised window title bar (click to make regular size)
        minimize: 'minimize',
        // "Pin column" item in column header menu
        menuPin: 'pin',
        // "Value aggregation" column menu item (shown on numeric columns when grouping is active)"
        menuValue: 'aggregation',
        // "Group by {column-name}" item in column header menu
        menuAddRowGroup: 'group',
        // "Un-Group by {column-name}" item in column header menu
        menuRemoveRowGroup: 'group',
        // context menu copy item
        clipboardCopy: 'copy',
        // context menu paste item
        clipboardPaste: 'paste',
        // identifies the pivot drop zone
        pivotPanel: 'pivot',
        // "Row groups" drop zone in column tool panel
        rowGroupPanel: 'group',
        // columns tool panel Values drop zone
        valuePanel: 'aggregation',
        // drag handle used to pick up draggable columns
        columnDrag: 'grip',
        // drag handle used to pick up draggable rows
        rowDrag: 'grip',
        // context menu export item
        save: 'save',
        // icon on dropdown editors
        smallDown: 'small-down',
        // version of small-right used in RTL mode
        smallLeft: 'small-left',
        // separater between column 'pills' when you add multiple columns to the header drop zone
        smallRight: 'small-right',
        smallUp: 'small-up',
        // show on column header when column is sorted ascending
        sortAscending: 'asc',
        // show on column header when column is sorted descending
        sortDescending: 'desc',
        // show on column header when column has no sort, only when enabled with gridOptions.unSortIcon=true
        sortUnSort: 'none'
    };

    /**
     * If icon provided, use this (either a string, or a function callback).
     * if not, then use the default icon from the theme
     * @param {string} iconName
     * @param {GridOptionsWrapper} gridOptionsWrapper
     * @param {Column | null} [column]
     * @returns {HTMLElement}
     */
    static createIcon(iconName: string, gridOptionsWrapper: GridOptionsWrapper, column: Column | null): HTMLElement {
        const iconContents = this.createIconNoSpan(iconName, gridOptionsWrapper, column);

        if (iconContents.className.indexOf('ag-icon') > -1) {
            return iconContents;
        }

        const eResult = document.createElement('span');
        eResult.appendChild(iconContents);
        return eResult;
    }

    static createIconNoSpan(iconName: string, gridOptionsWrapper: GridOptionsWrapper, column?: Column | null, forceCreate?: boolean): HTMLElement {
        let userProvidedIcon: Function | string | null = null;

        // check col for icon first
        const icons: any = column && column.getColDef().icons;

        if (icons) {
            userProvidedIcon = icons[iconName];
        }

        // if not in col, try grid options
        if (gridOptionsWrapper && !userProvidedIcon) {
            const optionsIcons = gridOptionsWrapper.getIcons();
            if (optionsIcons) {
                userProvidedIcon = optionsIcons[iconName];
            }
        }

        // now if user provided, use it
        if (userProvidedIcon) {
            let rendererResult: any;

            if (typeof userProvidedIcon === 'function') {
                rendererResult = userProvidedIcon();
            } else if (typeof userProvidedIcon === 'string') {
                rendererResult = userProvidedIcon;
            } else {
                throw new Error('icon from grid options needs to be a string or a function');
            }

            if (typeof rendererResult === 'string') {
                return this.loadTemplate(rendererResult);
            } else if (this.isNodeOrElement(rendererResult)) {
                return rendererResult;
            } else {
                console.warn('ag-Grid: iconRenderer should return back a string or a dom object');
            }
        } else {
            const span = document.createElement('span');
            let cssClass = this.iconNameClassMap[iconName];

            if (!cssClass) {
                if (!forceCreate) {
                    console.warn(`ag-Grid: Did not find icon ${iconName}`);
                    cssClass = '';
                } else {
                    cssClass = iconName;
                }
            }
            span.setAttribute('class', "ag-icon ag-icon-" + cssClass);
            span.setAttribute("unselectable", "on");

            return span;
        }
    }

    static addStylesToElement(eElement: any, styles: any) {
        if (!styles) { return; }

        Object.keys(styles).forEach((key) => {
            const keyCamelCase = this.hyphenToCamelCase(key);
            if (keyCamelCase) {
                eElement.style[keyCamelCase] = styles[key];
            }
        });
    }

    static isHorizontalScrollShowing(element: HTMLElement): boolean {
        return element.clientWidth < element.scrollWidth;
    }

    static isVerticalScrollShowing(element: HTMLElement): boolean {
        return element.clientHeight < element.scrollHeight;
    }

    static getMaxDivHeight(): number {
        if (!document.body) { return -1; }

        let res = 1000000;
        // FF reports the height back but still renders blank after ~6M px
        const testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
        const div = this.loadTemplate("<div/>");
        document.body.appendChild(div);

        while (true) {
            const test = res * 2;
            div.style.height = test + 'px';

            if (test > testUpTo || div.clientHeight !== test) {
                break;
            } else {
                res = test;
            }
        }

        document.body.removeChild(div);

        return res;
    }

    static getScrollbarWidth() {
        const body = document.body;
        const div = document.createElement("div");

        div.style.width = div.style.height = "100px";
        div.style.opacity = "0";
        div.style.overflow = "scroll";
        div.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
        div.style.position = "absolute";

        body.appendChild(div);

        const width = div.offsetWidth - div.clientWidth;

        // remove divs
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }

        return width;
    }

    static hasOverflowScrolling(): boolean {
        const prefixes: string[] = ['webkit', 'moz', 'o', 'ms'];
        const div: HTMLElement = document.createElement('div');
        const body: HTMLBodyElement = document.getElementsByTagName('body')[0];
        let found: boolean = false;
        let p: string;

        body.appendChild(div);
        div.setAttribute('style', prefixes.map(prefix => `-${prefix}-overflow-scrolling: touch`).concat('overflow-scrolling: touch').join(';'));

        const computedStyle: CSSStyleDeclaration = window.getComputedStyle(div);

        if ((computedStyle as any).overflowScrolling === 'touch') {
            found = true;
        }

        if (!found) {
            for (p of prefixes) {
                if ((computedStyle as any)[`${p}OverflowScrolling`] === 'touch') {
                    found = true;
                    break;
                }
            }
        }

        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }

        return found;
    }

    static isKeyPressed(event: KeyboardEvent, keyToCheck: number) {
        const pressedKey = event.which || event.keyCode;
        return pressedKey === keyToCheck;
    }

    static isCharacterKey(event: KeyboardEvent): boolean {
        // from: https://stackoverflow.com/questions/4179708/how-to-detect-if-the-pressed-key-will-produce-a-character-inside-an-input-text
        const { which } = event;

        if (typeof which === 'number' && which) {
            return !event.ctrlKey && !event.metaKey && !event.altKey && event.which !== 8 && event.which !== 16;
        }

        return which === undefined;
    }

    static setDisplayed(element: HTMLElement, displayed: boolean) {
        this.addOrRemoveCssClass(element, 'ag-hidden', !displayed);
    }

    static setVisible(element: HTMLElement, visible: boolean) {
        this.addOrRemoveCssClass(element, 'ag-invisible', !visible);
    }

    static setElementWidth(element: HTMLElement, width: string | number) {
        if (width === 'flex') {
            element.style.width = null;
            element.style.minWidth = null;
            element.style.maxWidth = null;
            element.style.flex = '1 1 auto';
        } else {
            this.setFixedWidth(element, width);
        }
    }

    static setFixedWidth(element: HTMLElement, width: string | number) {
        width = this.formatSize(width);
        element.style.width = width;
        element.style.maxWidth = width;
        element.style.minWidth = width;
    }

    static setElementHeight(element: HTMLElement, height: string | number) {
        if (height === 'flex') {
            element.style.height = null;
            element.style.minHeight = null;
            element.style.maxHeight = null;
            element.style.flex = '1 1 auto';
        } else {
            this.setFixedHeight(element, height);
        }
    }

    static setFixedHeight(element: HTMLElement, height: string | number) {
        height = this.formatSize(height);
        element.style.height = height;
        element.style.maxHeight = height;
        element.style.minHeight = height;
    }

    static isBrowserIE(): boolean {
        if (this.isIE === undefined) {
            this.isIE = /*@cc_on!@*/false || !!(document as any).documentMode; // At least IE6
        }

        return this.isIE;
    }

    static isBrowserEdge(): boolean {
        if (this.isEdge === undefined) {
            this.isEdge = !this.isBrowserIE() && !!(window as any).StyleMedia;
        }

        return this.isEdge;
    }

    static isBrowserSafari(): boolean {
        if (this.isSafari === undefined) {
            const anyWindow = window as any;
            // taken from https://github.com/ag-grid/ag-grid/issues/550
            this.isSafari = Object.prototype.toString.call(anyWindow.HTMLElement).indexOf('Constructor') > 0
                || (function(p) {
                    return p ? p.toString() === "[object SafariRemoteNotification]" : false;
                })
                    (!anyWindow.safari || anyWindow.safari.pushNotification);
        }
        return this.isSafari;
    }

    static isBrowserChrome(): boolean {
        if (this.isChrome === undefined) {
            const win = window as any;
            this.isChrome = (!!win.chrome && (!!win.chrome.webstore || !!win.chrome.runtime)) ||
                (/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor));
        }

        return this.isChrome;
    }

    static isBrowserFirefox(): boolean {
        if (this.isFirefox === undefined) {
            const win = window as any;
            this.isFirefox = typeof win.InstallTrigger !== 'undefined';
        }

        return this.isFirefox;
    }

    static isIOSUserAgent(): boolean {
        if (this.isIOS === undefined) {
            // taken from https://stackoverflow.com/a/58064481/1388233
            this.isIOS = (/iPad|iPhone|iPod/.test(navigator.platform) ||
                // eslint-disable-next-line
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
                !window.MSStream;
        }

        return this.isIOS;
    }

    /**
     * srcElement is only available in IE. In all other browsers it is target
     * http://stackoverflow.com/questions/5301643/how-can-i-make-event-srcelement-work-in-firefox-and-what-does-it-mean
     * @param {Event} event
     * @returns {Element}
     */
    static getTarget(event: Event): Element {
        const eventNoType = event as any;

        return eventNoType.target || eventNoType.srcElement;
    }

    static isElementChildOfClass(element: HTMLElement, cls: string, maxNest?: number): boolean {
        let counter = 0;

        while (element) {
            if (this.containsClass(element, cls)) {
                return true;
            }
            element = element.parentElement;
            if (maxNest && ++counter > maxNest) { break; }
        }

        return false;
    }

    static isElementInEventPath(element: HTMLElement, event: Event): boolean {
        if (!event || !element) { return false; }

        const path = _.getEventPath(event);

        return path.indexOf(element) >= 0;
    }

    static isFunction(val: any): boolean {
        return !!(val && val.constructor && val.call && val.apply);
    }

    static createEventPath(event: Event): EventTarget[] {
        const res: EventTarget[] = [];
        let pointer: any = _.getTarget(event);

        while (pointer) {
            res.push(pointer);
            pointer = pointer.parentElement;
        }

        return res;
    }

    /**
     * firefox doesn't have event.path set, or any alternative to it, so we hack
     * it in. this is needed as it's to late to work out the path when the item is
     * removed from the dom. used by MouseEventService, where it works out if a click
     * was from the current grid, or a detail grid (master / detail).
     * @param {Event} event
     */
    static addAgGridEventPath(event: Event): void {
        (event as any).__agGridEventPath = this.getEventPath(event);
    }

    /**
     * Gets the path for an Event.
     * https://stackoverflow.com/questions/39245488/event-path-undefined-with-firefox-and-vue-js
     * https://developer.mozilla.org/en-US/docs/Web/API/Event
     * @param {Event} event
     * @returns {EventTarget[]}
     */
    static getEventPath(event: Event): EventTarget[] {
        const eventNoType = event as any;

        if (eventNoType.deepPath) {
            // IE supports deep path
            return eventNoType.deepPath();
        }

        if (eventNoType.path) {
            // Chrome supports path
            return eventNoType.path;
        }

        if (eventNoType.composedPath) {
            // Firefox supports composePath
            return eventNoType.composedPath();
        }

        if (eventNoType.__agGridEventPath) {
            // Firefox supports composePath
            return eventNoType.__agGridEventPath;
        }

        // and finally, if none of the above worked,
        // we create the path ourselves
        return this.createEventPath(event);
    }

    static forEachSnapshotFirst(list: any[], callback: (item: any) => void): void {
        if (!list) { return; }

        const arrayCopy = list.slice(0);
        arrayCopy.forEach(callback);
    }

    /**
     * Gets the document body width
     * from: http://stackoverflow.com/questions/1038727/how-to-get-browser-width-using-javascript-code
     * @returns {number}
     */
    static getBodyWidth(): number {
        if (document.body) {
            return document.body.clientWidth;
        }

        if (window.innerHeight) {
            return window.innerWidth;
        }

        if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth;
        }

        return -1;
    }

    /**
     * Gets the body height
     * from: http://stackoverflow.com/questions/1038727/how-to-get-browser-width-using-javascript-code
     * @returns {number}
     */
    static getBodyHeight(): number {
        if (document.body) {
            return document.body.clientHeight;
        }

        if (window.innerHeight) {
            return window.innerHeight;
        }

        if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight;
        }

        return -1;
    }

    static setCheckboxState(eCheckbox: any, state: any) {
        if (typeof state === 'boolean') {
            eCheckbox.checked = state;
            eCheckbox.indeterminate = false;
        } else {
            // isNodeSelected returns back undefined if it's a group and the children
            // are a mix of selected and unselected
            eCheckbox.indeterminate = true;
        }
    }

    static traverseNodesWithKey(nodes: RowNode[], callback: (node: RowNode, key: string) => void): void {
        const keyParts: any[] = [];

        recursiveSearchNodes(nodes);

        function recursiveSearchNodes(currentNodes: RowNode[]): void {
            currentNodes.forEach((node: RowNode) => {

                // also checking for children for tree data
                if (node.group || node.hasChildren()) {
                    keyParts.push(node.key);
                    const key = keyParts.join('|');
                    callback(node, key);
                    recursiveSearchNodes(node.childrenAfterGroup);
                    keyParts.pop();
                }
            });
        }
    }

    /**
     * Converts a camelCase string into hyphenated string
     * from https://gist.github.com/youssman/745578062609e8acac9f
     * @param {string} str
     * @return {string}
     */
    static camelCaseToHyphen(str: string): string | null {
        if (str === null || str === undefined) { return null; }
    
        return str.replace(/([A-Z])/g, (g) => '-' + g[0].toLowerCase());
    }

    /**
     * Converts a hyphenated string into camelCase string
     * from https://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
     * @param {string} str
     * @return {string}
     */
    static hyphenToCamelCase(str: string): string | null {
        if (str === null || str === undefined) {
            return null;
        }
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    static capitalise(str: string): string {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    }

    /**
     * Converts a CSS object into string
     * @param {Object} stylesToUse an object eg: {color: 'black', top: '25px'}
     * @return {string} A string like "color: black; top: 25px;" for html
     */
    static cssStyleObjectToMarkup(stylesToUse: any): string {
        if (!stylesToUse) { return ''; }

        const resParts: string[] = [];
        this.iterateObject(stylesToUse, (styleKey: string, styleValue: string) => {
            const styleKeyDashed = this.camelCaseToHyphen(styleKey);
            resParts.push(`${styleKeyDashed}: ${styleValue};`);
        });

        return resParts.join(' ');
    }

    /**
     * Check if a value is numeric
     * from http://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers
     * @param {any} value
     * @return {boolean}
     */
    static isNumeric(value: any): boolean {
        if (value === '') { return false; }

        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    static escape(toEscape: string | null): string | null {
        if (toEscape === null || toEscape === undefined || !toEscape.replace) { return toEscape; }

        return toEscape.replace(reUnescapedHtml, chr => HTML_ESCAPES[chr]);
    }

    /**
     * Mouse wheel (and 2-finger trackpad) support on the web sucks.  It is
     * complicated, thus this doc is long and (hopefully) detailed enough to answer
     * your questions.
     *
     * If you need to react to the mouse wheel in a predictable way, this code is
     * like your bestest friend. * hugs *
     *
     * As of today, there are 4 DOM event types you can listen to:
     *
     *   'wheel'                -- Chrome(31+), FF(17+), IE(9+)
     *   'mousewheel'           -- Chrome, IE(6+), Opera, Safari
     *   'MozMousePixelScroll'  -- FF(3.5 only!) (2010-2013) -- don't bother!
     *   'DOMMouseScroll'       -- FF(0.9.7+) since 2003
     *
     * So what to do?  The is the best:
     *
     *   normalizeWheel.getEventType();
     *
     * In your event callback, use this code to get sane interpretation of the
     * deltas.  This code will return an object with properties:
     *
     *   spinX   -- normalized spin speed (use for zoom) - x plane
     *   spinY   -- " - y plane
     *   pixelX  -- normalized distance (to pixels) - x plane
     *   pixelY  -- " - y plane
     *
     * Wheel values are provided by the browser assuming you are using the wheel to
     * scroll a web page by a number of lines or pixels (or pages).  Values can vary
     * significantly on different platforms and browsers, forgetting that you can
     * scroll at different speeds.  Some devices (like trackpads) emit more events
     * at smaller increments with fine granularity, and some emit massive jumps with
     * linear speed or acceleration.
     *
     * This code does its best to normalize the deltas for you:
     *
     *   - spin is trying to normalize how far the wheel was spun (or trackpad
     *     dragged).  This is super useful for zoom support where you want to
     *     throw away the chunky scroll steps on the PC and make those equal to
     *     the slow and smooth tiny steps on the Mac. Key data: This code tries to
     *     resolve a single slow step on a wheel to 1.
     *
     *   - pixel is normalizing the desired scroll delta in pixel units.  You'll
     *     get the crazy differences between browsers, but at least it'll be in
     *     pixels!
     *
     *   - positive value indicates scrolling DOWN/RIGHT, negative UP/LEFT.  This
     *     should translate to positive value zooming IN, negative zooming OUT.
     *     This matches the newer 'wheel' event.
     *
     * Why are there spinX, spinY (or pixels)?
     *
     *   - spinX is a 2-finger side drag on the trackpad, and a shift + wheel turn
     *     with a mouse.  It results in side-scrolling in the browser by default.
     *
     *   - spinY is what you expect -- it's the classic axis of a mouse wheel.
     *
     *   - I dropped spinZ/pixelZ.  It is supported by the DOM 3 'wheel' event and
     *     probably is by browsers in conjunction with fancy 3D controllers .. but
     *     you know.
     *
     * Implementation info:
     *
     * Examples of 'wheel' event if you scroll slowly (down) by one step with an
     * average mouse:
     *
     *   OS X + Chrome  (mouse)     -    4   pixel delta  (wheelDelta -120)
     *   OS X + Safari  (mouse)     -  N/A   pixel delta  (wheelDelta  -12)
     *   OS X + Firefox (mouse)     -    0.1 line  delta  (wheelDelta  N/A)
     *   Win8 + Chrome  (mouse)     -  100   pixel delta  (wheelDelta -120)
     *   Win8 + Firefox (mouse)     -    3   line  delta  (wheelDelta -120)
     *
     * On the trackpad:
     *
     *   OS X + Chrome  (trackpad)  -    2   pixel delta  (wheelDelta   -6)
     *   OS X + Firefox (trackpad)  -    1   pixel delta  (wheelDelta  N/A)
     *
     * On other/older browsers.. it's more complicated as there can be multiple and
     * also missing delta values.
     *
     * The 'wheel' event is more standard:
     *
     * http://www.w3.org/TR/DOM-Level-3-Events/#events-wheelevents
     *
     * The basics is that it includes a unit, deltaMode (pixels, lines, pages), and
     * deltaX, deltaY and deltaZ.  Some browsers provide other values to maintain
     * backward compatibility with older events.  Those other values help us
     * better normalize spin speed.  Example of what the browsers provide:
     *
     *                          | event.wheelDelta | event.detail
     *        ------------------+------------------+--------------
     *          Safari v5/OS X  |       -120       |       0
     *          Safari v5/Win7  |       -120       |       0
     *         Chrome v17/OS X  |       -120       |       0
     *         Chrome v17/Win7  |       -120       |       0
     *                IE9/Win7  |       -120       |   undefined
     *         Firefox v4/OS X  |     undefined    |       1
     *         Firefox v4/Win7  |     undefined    |       3
     *
     * from: https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
     * @param {any} event
     * @return {any}
     */
    static normalizeWheel(event: any): any {
        const PIXEL_STEP = 10;
        const LINE_HEIGHT = 40;
        const PAGE_HEIGHT = 800;

        // spinX, spinY
        let sX = 0;
        let sY = 0;

        // pixelX, pixelY
        let pX = 0;
        let pY = 0;

        // Legacy
        if ('detail' in event) {
            sY = event.detail;
        }

        if ('wheelDelta' in event) {
            sY = -event.wheelDelta / 120;
        }

        if ('wheelDeltaY' in event) {
            sY = -event.wheelDeltaY / 120;
        }

        if ('wheelDeltaX' in event) {
            sX = -event.wheelDeltaX / 120;
        }

        // side scrolling on FF with DOMMouseScroll
        if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
            sX = sY;
            sY = 0;
        }

        pX = sX * PIXEL_STEP;
        pY = sY * PIXEL_STEP;

        if ('deltaY' in event) {
            pY = event.deltaY;
        }

        if ('deltaX' in event) {
            pX = event.deltaX;
        }

        if ((pX || pY) && event.deltaMode) {
            if (event.deltaMode == 1) {          // delta in LINE units
                pX *= LINE_HEIGHT;
                pY *= LINE_HEIGHT;
            } else {                             // delta in PAGE units
                pX *= PAGE_HEIGHT;
                pY *= PAGE_HEIGHT;
            }
        }

        // Fall-back if spin cannot be determined
        if (pX && !sX) {
            sX = (pX < 1) ? -1 : 1;
        }
        if (pY && !sY) {
            sY = (pY < 1) ? -1 : 1;
        }

        return {
            spinX: sX,
            spinY: sY,
            pixelX: pX,
            pixelY: pY
        };
    }

    /**
     * from https://stackoverflow.com/questions/24004791/can-someone-explain-the-debounce-function-in-javascript
     * @param {Function} func The function to be debounced
     * @param {number} wait The time in ms to debounce
     * @param {boolean} immediate If it should run immediately or wait for the initial debounce delay
     * @return {Function} The debounced function
     */
    static debounce(func: (...args: any[]) => void, wait: number, immediate: boolean = false) {
        // 'private' variable for instance
        // The returned function will be able to reference this due to closure.
        // Each call to the returned function will share this common timer.
        let timeout: any;

        // Calling debounce returns a new anonymous function
        return function(...args: any[]) {
            // reference the context and args for the setTimeout function
            const context = this;

            // Should the function be called now? If immediate is true
            //   and not already in a timeout then the answer is: Yes
            const callNow = immediate && !timeout;

            // This is the basic debounce behaviour where you can call this
            //   function several times, but it will only execute once
            //   [before or after imposing a delay].
            //   Each time the returned function is called, the timer starts over.
            window.clearTimeout(timeout);

            // Set the new timeout
            timeout = window.setTimeout(function() {

                // Inside the timeout function, clear the timeout variable
                // which will let the next execution run when in 'immediate' mode
                timeout = null;

                // Check if the function already ran with the immediate flag
                if (!immediate) {
                    // Call the original function with apply
                    // apply lets you define the 'this' object as well as the arguments
                    //    (both captured before setTimeout)
                    func.apply(context, args);
                }
            }, wait);

            // Immediate mode and no wait timer? Execute the function..
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    /**
     * a user once raised an issue - they said that when you opened a popup (eg context menu)
     * and then clicked on a selection checkbox, the popup wasn't closed. this is because the
     * popup listens for clicks on the body, however ag-grid WAS stopping propagation on the
     * checkbox clicks (so the rows didn't pick them up as row selection selection clicks).
     * to get around this, we have a pattern to stop propagation for the purposes of ag-Grid,
     * but we still let the event pass back to the body.
     * @param {Event} event
     */
    static stopPropagationForAgGrid(event: Event): void {
        (event as any)[AG_GRID_STOP_PROPAGATION] = true;
    }

    static isStopPropagationForAgGrid(event: Event): boolean {
        return (event as any)[AG_GRID_STOP_PROPAGATION] === true;
    }

    static executeInAWhile(funcs: Function[]): void {
        this.executeAfter(funcs, 400);
    }

    static executeNextVMTurn(funcs: Function[]): void {
        this.executeAfter(funcs, 0);
    }

    static executeAfter(funcs: Function[], millis: number): void {
        if (funcs.length > 0) {
            window.setTimeout(() => {
                funcs.forEach(func => func());
            }, millis);
        }
    }

    static referenceCompare(left: any, right: any): boolean {
        if (left == null && right == null) {
            return true;
        }

        if (left == null && right) {
            return false;
        }

        if (left && right == null) {
            return false;
        }

        return left === right;
    }

    static get(source: any, expression: string, defaultValue: any): any {
        if (source == null) { return defaultValue; }

        const keys = expression.split(".");
        let objectToRead = source;

        while (keys.length > 1) {
            objectToRead = objectToRead[keys.shift()];

            if (objectToRead == null) {
                return defaultValue;
            }
        }

        const value = objectToRead[keys[0]];

        return value != null ? value : defaultValue;
    }

    static set(target: any, expression: string, value: any) {
        if (target == null) { return; }

        const keys = expression.split(".");
        let objectToUpdate = target;

        while (keys.length > 1) {
            objectToUpdate = objectToUpdate[keys.shift()];

            if (objectToUpdate == null) {
                return;
            }
        }

        objectToUpdate[keys[0]] = value;
    }

    static addSafePassiveEventListener(
        frameworkOverrides: IFrameworkOverrides,
        eElement: HTMLElement,
        event: string, listener: (event?: any) => void
    ) {
        const isPassive = this.includes(Utils.PASSIVE_EVENTS, event);
        const isOutsideAngular = this.includes(Utils.OUTSIDE_ANGULAR_EVENTS, event);
        const options = isPassive ? { passive: true } : undefined;

        if (isOutsideAngular) {
            frameworkOverrides.addEventListenerOutsideAngular(eElement, event, listener, options);
        } else {
            eElement.addEventListener(event, listener, options);
        }
    }

    /**
     * Converts a camelCase string into regular text
     * from: https://stackoverflow.com/questions/15369566/putting-space-in-camel-case-string-using-regular-expression
     * @param {string} camelCase
     * @return {string}
     */
    static camelCaseToHumanText(camelCase: string | undefined): string | null {
        if (!camelCase || camelCase == null) { return null;}

        const rex = /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g;
        const words: string[] = camelCase.replace(rex, '$1$4 $2$3$5').replace('.', ' ').split(' ');

        return words.map(word => word.substring(0, 1).toUpperCase() + ((word.length > 1) ? word.substring(1, word.length) : '')).join(' ');
    }

    /**
     * Displays a message to the browser. this is useful in iPad, where you can't easily see the console.
     * so the javascript code can use this to give feedback. this is NOT intended to be called in production.
     * it is intended the ag-Grid developer calls this to troubleshoot, but then takes out the calls before
     * checking in.
     * @param {string} msg
     */
    static message(msg: string): void {
        const eMessage = document.createElement('div');
        let eBox = document.querySelector('#__ag__message');

        eMessage.innerHTML = msg;

        if (!eBox) {
            const template = `<div id="__ag__message" style="display: inline-block; position: absolute; top: 0px; left: 0px; color: white; background-color: black; z-index: 20; padding: 2px; border: 1px solid darkred; height: 200px; overflow-y: auto;"></div>`;
            eBox = this.loadTemplate(template);
            if (document.body) {
                document.body.appendChild(eBox);
            }
        }
        eBox.insertBefore(eMessage, eBox.children[0]);
    }

    /**
     * Gets called by: a) ClientSideNodeManager and b) GroupStage to do sorting.
     * when in ClientSideNodeManager we always have indexes (as this sorts the items the
     * user provided) but when in GroupStage, the nodes can contain filler nodes that
     * don't have order id's
     * @param {RowNode[]} rowNodes
     * @param {Object} rowNodeOrder
     */
    static sortRowNodesByOrder(rowNodes: RowNode[], rowNodeOrder: { [id: string]: number; }): void {
        if (!rowNodes) { return; }

        const comparator = (nodeA: RowNode, nodeB: RowNode) => {
            const positionA = rowNodeOrder[nodeA.id];
            const positionB = rowNodeOrder[nodeB.id];

            const aHasIndex = positionA !== undefined;
            const bHasIndex = positionB !== undefined;

            const bothNodesAreUserNodes = aHasIndex && bHasIndex;
            const bothNodesAreFillerNodes = !aHasIndex && !bHasIndex;

            if (bothNodesAreUserNodes) {
                // when comparing two nodes the user has provided, they always
                // have indexes
                return positionA - positionB;
            }

            if (bothNodesAreFillerNodes) {
                // when comparing two filler nodes, we have no index to compare them
                // against, however we want this sorting to be deterministic, so that
                // the rows don't jump around as the user does delta updates. so we
                // want the same sort result. so we use the __objectId - which doesn't make sense
                // from a sorting point of view, but does give consistent behaviour between
                // calls. otherwise groups jump around as delta updates are done.
                // note: previously here we used nodeId, however this gave a strange order
                // as string ordering of numbers is wrong, so using id based on creation order
                // as least gives better looking order.
                return nodeA.__objectId - nodeB.__objectId;
            }

            if (aHasIndex) {
                return 1;
            }

            return -1;
        };

        // check if the list first needs sorting
        let rowNodeA: RowNode;
        let rowNodeB: RowNode;
        let atLeastOneOutOfOrder = false;

        for (let i = 0; i < rowNodes.length - 1; i++) {
            rowNodeA = rowNodes[i];
            rowNodeB = rowNodes[i + 1];

            if (comparator(rowNodeA, rowNodeB) > 0) {
                atLeastOneOutOfOrder = true;
                break;
            }
        }

        if (atLeastOneOutOfOrder) {
            rowNodes.sort(comparator);
        }
    }

    public static fuzzyCheckStrings(
        inputValues: string[],
        validValues: string[],
        allSuggestions: string[]
    ): { [p: string]: string[]; } {
        const fuzzyMatches: { [p: string]: string[]; } = {};
        const invalidInputs: string[] = inputValues.filter(inputValue =>
            !validValues.some(
                (validValue) => validValue === inputValue
            )
        );

        if (invalidInputs.length > 0) {
            invalidInputs.forEach(invalidInput =>
                fuzzyMatches[invalidInput] = this.fuzzySuggestions(invalidInput, allSuggestions)
            );
        }

        return fuzzyMatches;
    }

    /**
     *
     * @param {String} inputValue The value to be compared against a list of strings
     * @param allSuggestions The list of strings to be compared against
     * @param hideIrrelevant By default, fuzzy suggestions will just sort the allSuggestions list, set this to true
     *        to filter out the irrelevant values
     * @param weighted Set this to true, to make letters matched in the order they were typed have priority in the results.
     */
    public static fuzzySuggestions(
        inputValue: string,
        allSuggestions: string[],
        hideIrrelevant?: boolean,
        weighted?: true
    ): string[] {
        const search = weighted ? _.string_weighted_distances : _.string_distances;
        let thisSuggestions: { value: string, relevance: number; }[] = allSuggestions.map((text) => ({
            value: text,
            relevance: search(inputValue.toLowerCase(), text.toLocaleLowerCase())
        }));

        thisSuggestions.sort((a, b) => b.relevance - a.relevance);

        if (hideIrrelevant) {
            thisSuggestions = thisSuggestions.filter(suggestion => suggestion.relevance !== 0);
        }

        return thisSuggestions.map(suggestion => suggestion.value);
    }

    /**
     * Algorithm to do fuzzy search
     * from https://stackoverflow.com/questions/23305000/javascript-fuzzy-search-that-makes-sense
     * @param {string} from
     * @return {[]}
     */
    static get_bigrams(from: string) {
        const s = from.toLowerCase();
        const v = new Array(s.length - 1);
        let i;
        let j;
        let ref;

        for (i = j = 0, ref = v.length; j <= ref; i = j += 1) {
            v[i] = s.slice(i, i + 2);

        }

        return v;
    }

    static string_distances(str1: string, str2: string): number {
        if (str1.length === 0 && str2.length === 0) { return 0; }

        const pairs1 = _.get_bigrams(str1);
        const pairs2 = _.get_bigrams(str2);
        const union = pairs1.length + pairs2.length;
        let hit_count = 0;
        let j;
        let len;

        for (j = 0, len = pairs1.length; j < len; j++) {
            const x = pairs1[j];
            let k;
            let len1;

            for (k = 0, len1 = pairs2.length; k < len1; k++) {
                const y = pairs2[k];
                if (x === y) {
                    hit_count++;
                }
            }
        }

        return hit_count > 0 ? (2 * hit_count) / union : 0;
    }

    static string_weighted_distances(str1: string, str2: string): number {
        const a = str1.replace(/\s/g, '');
        const b = str2.replace(/\s/g, '');

        let weight = 0;
        let lastIndex = 0;

        for (let i = 0; i < a.length; i++) {
            const idx = b.indexOf(a[i]);
            if (idx === -1) {
                continue;
            }

            lastIndex = idx;
            weight += ((b.length - lastIndex) * 100) / b.length;
            weight *= weight;
        }

        return weight;
    }

    private static isNumpadDelWithNumlockOnForEdgeOrIe(event: KeyboardEvent) {
        if (Utils.isBrowserEdge() || Utils.isBrowserIE()) {
            return event.key === Utils.NUMPAD_DEL_NUMLOCK_ON_KEY &&
                event.charCode === Utils.NUMPAD_DEL_NUMLOCK_ON_CHARCODE;
        }

        return false;
    }

    /**
     * cell renderers are used in a few places. they bind to dom slightly differently to other cell renderes as they
     * can return back strings (instead of html elemnt) in the getGui() method. common code placed here to handle that.
     * @param {Promise<ICellRendererComp>} cellRendererPromise
     * @param {HTMLElement} eTarget
     */
    public static bindCellRendererToHtmlElement(cellRendererPromise: Promise<ICellRendererComp>, eTarget: HTMLElement) {
        cellRendererPromise.then(cellRenderer => {
            const gui: HTMLElement | string = cellRenderer.getGui();
            if (gui != null) {
                if (typeof gui == 'object') {
                    eTarget.appendChild(gui);
                } else {
                    eTarget.innerHTML = gui;
                }
            }
        });
    }

    static convertToSet<T>(list: T[]): Set<T> {
        const set = new Set<T>();

        list.forEach(x => set.add(x));

        return set;
    }

    static deepFreeze(object: any): any {
        Object.freeze(object);

        _.values(object).filter(v => v != null).forEach(v => {
            if (typeof v === 'object' || typeof v === 'function') {
                this.deepFreeze(v);
            }
        });

        return object;
    }
}

export const _ = Utils;