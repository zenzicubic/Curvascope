/**
 * This component represents a simple toggle with a label.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

import './LabelledToggle.css';

import React from 'react';
import { Switch } from 'antd';

function LabelledToggle(props) {
    return (
        <div className="toggle-parent">
            <Switch defaultChecked={props.toggled} onChange={props.onChange} />
            <span className="toggle-label">{props.lbl}</span>
        </div>);
}

export default LabelledToggle;