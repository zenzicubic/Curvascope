/**
 * This is a simple color picker, with support for keyboard navigation
 * via arrows and tab. It also contains a preset list of colors to use.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

import './ColorPicker.css';

import React from 'react';
import { useState, useCallback } from 'react';

// Colors to display
const colors = [[244, 67, 54], [233, 30, 99], [156, 39, 176], [103, 58, 183], [63, 81, 181], [33, 150, 243], [3, 169, 244], [0, 188, 212], [0, 150, 136], [76, 175, 80], [139, 195, 74], [205, 220, 57], [255, 235, 59], [255, 235, 59], [255, 193, 7], [255, 152, 0], [255, 87, 34], [183, 28, 28], [136, 14, 79], [74, 20, 140], [49, 27, 146], [13, 71, 161], [1, 87, 155], [0, 96, 100], [0, 77, 64], [27, 94, 32], [51, 105, 30], [130, 119, 23], [245, 127, 23], [255, 111, 0], [230, 81, 0], [191, 54, 12], [250, 250, 250], [96, 125, 139]];

// Format a color in CSS format
const formatColor = (col) => `rgb(${col[0]}, ${col[1]}, ${col[2]})`;

/*
Color picker component.
*/

function ColorPicker(props) {
    const [colIdx, setColIdx] = useState(props.selIdx);

    const handleKeypress = useCallback((evt) => {
        let nIdx;

        // Check if any key pressed
        switch (evt.key) {
            default:
                break;
            case "ArrowLeft":
                setColIdx(idx => (nIdx = Math.max(0, idx - 1)));
                props.onChange(nIdx);
                break;
            case "ArrowRight":
                setColIdx(idx => (nIdx = Math.min(idx + 1, colors.length - 1)));
                props.onChange(nIdx);
                break;
        }
    }, [props]);

    return (
    <div className="color-picker" tabIndex="0" onKeyDown={handleKeypress}>
        {
            colors.map((col, i) => {
                return (<button
                    key={"colorPicker-" + props.componentName + "-" + i}
                    className={"color-picker-btn" + (colIdx === i ? " focused" : "")} 
                    style={{backgroundColor: formatColor(col)}}
                    onClick={() => {
                        setColIdx(i);
                        props.onChange(i);
                    }}
                    tabIndex="-1"></button>);
            })
        }
    </div>);
}

export { ColorPicker, colors };