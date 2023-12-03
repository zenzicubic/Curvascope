/**
 * This component represents a simple slider with label and value display.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

import './LabelledSlider.css';

import React from 'react';
import { useState } from 'react';
import { Slider } from 'antd';

function LabelledSlider(props) {
    // Handle updating value display on slider update
    const [sliderVal, setVal] = useState(props.value);
    const onChange = (val) => {
        setVal(val);
        props.onChange(val);
    }
    
    return (<>
            <p>{props.lbl}</p>
            <div className="slider-parent">
                <div className="slider-container">
                    <Slider 
                        min={props.min} max={props.max} defaultValue={props.value} 
                        tooltip={{open: false}} onChange={onChange} />
                </div>
                <span className="slider-label">{sliderVal}</span>
            </div>
        </>);
}

export default LabelledSlider;