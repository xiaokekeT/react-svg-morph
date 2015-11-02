import * as PathConverter from './PathConverter';

export function readAttrs(node) {
    var attrs = {};
    Object.keys(node.attributes).forEach(function(_key) {
        var val = node.attributes[_key];
        var key = _key.toLowerCase();
        switch (key) {
        case 'fill':
        case 'fill-opacity':
        case 'opacity':
        case 'stroke':
        case 'stroke-opacity':
        case 'stroke-width':
            attrs[key] = val;
        }
    });
    return attrs;
}


export function parseStyles(styleString) {
    if (!styleString) {
        return [];
    }

    return styleString.split(';').map(function(declaration) {
        var [prop, val] = declaration.split(':').map(function(p) {
            return p.replace(' ', '');
        });
        return {
            prop,
            val,
        };
    });
}

export function readStyles(node) {
    var style = {};
    console.log('node', node.attributes);
    parseStyles(node.attributes.style).forEach(({val, key}) => {
        switch (key) {
        case 'fill':
        case 'fill-opacity':
        case 'opacity':
        case 'stroke':
        case 'stroke-opacity':
        case 'stroke-width':
            style[key] = val;
        }
    });
    return style;
}

export function getAllChildren(node) {
    var i = 0;
    var els = [];
    var len = node.children.length;
    for ( ; i < len; i++) {
        let el = node.children[i];
        els.push(el);
        if (el.children.length > 0) {
            els = els.concat(getAllChildren(el));
        }
    }

    return els;
}

export function getPathAttributes(node, defaultItem) {
    var item = {
        trans: {
            rotate: [360, 12, 12],
        },
        transStr: 'rotate(360 12 12)',
        ...defaultItem,
    };

    var nodeName = node.name.toUpperCase();
    switch (nodeName) {
    case 'PATH':
        item.path = node.attributes.d;
        break;
    case 'CIRCLE':
        item.path = PathConverter.fromCircle(node.attributes);
        break;
    case 'ELLIPSE':
        item.path = PathConverter.fromEllipse(node.attributes);
        break;
    case 'RECT':
        item.path = PathConverter.fromRect(node.attributes);
        break;
    case 'POLYGON':
        item.path = PathConverter.fromPolygon(node.attributes);
        break;
    case 'LINE':
        item.path = PathConverter.fromLine(node.attributes);
        break;
    default:
        return false;
    }
    let attrs = readAttrs(node);
    let style = readStyles(node);
    item.attrs = {...item.attrs, ...attrs};
    item.style = {...item.style, ...style};
    return item;
}

export default function findSvgRoot(node) {
    if (node.name.toUpperCase() === "SVG") {
        return node;
    }
    return node.children.find((child) => findSvgRoot(child));
}

export default function extractSvgPaths(root) {
    var svgRoot = findSvgRoot(root);
    var children = getAllChildren(svgRoot);
    var svg = { ...svgRoot.attributes };

    var rootAttr = readAttrs(svgRoot);
    var rootStyles = readStyles(svgRoot);

    svg.paths = [];
    children.forEach((child) => {

        var item = getPathAttributes(child, {
            attrs: { ...rootAttr, ...readAttrs(child) },
            styles: { ...rootStyles, ...readStyles(child) },
        });
        if (item) {
            svg.paths.push(item);
        }
    });

    return svg;
}
