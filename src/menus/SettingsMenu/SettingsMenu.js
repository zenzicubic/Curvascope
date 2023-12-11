/**
 * This is the settings menu component. It manages the settings menu.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

import React from 'react';
import { Drawer, Select, Alert } from 'antd';
import { useState, useContext, useCallback } from 'react';

import LabelledToggle from './sliders/LabelledToggle.js';
import LabelledSlider from './sliders/LabelledSlider.js';
import { generateTilingParams } from '../../math.js';
import { ParamContext } from '../../App.js';
import { ColorPicker } from './colorpicker/ColorPicker.js';

// Names of hyperbolic models and indices
const modelNames = [
    { label: "Poincar\u00E9 disk", value: 0 },
    { label: "Upper half-plane model", value: 1 },
    { label: "Beltrami-Klein disk", value: 2 },
    { label: "Poincar\u00E9 disk complement", value: 3 },
    { label: "Gans model", value: 4 },
    { label: "Azimuthal equidistant projection", value: 5 },
    { label: "Equal-area projection", value: 6 },
    { label: "Band model", value: 7 }
];

/*
This is the Tiling section of the Settings menu.
*/

const maxSides = 10;

function TilingSelector() {
    const params = useContext(ParamContext);   

    // Whether or not to show the error message
    const [hasError, setError] = useState(false);

    // Temporary storage for slider values
    const [pVal, setPVal] = useState(params[0].pValue); 
    const [qVal, setQVal] = useState(params[0].qValue); 

    const setValues = useCallback((p, q) => {
        // Check for valid tiling
        if ((p - 2) * (q - 2) <= 4) {
            setError(true);
            return;
        }

        // If valid, compute parameters and store Schlafli symbol
        setError(false);
        params[1]({
            ...params[0],
            ...generateTilingParams(p, q),
            pValue: p,
            qValue: q});
    }, [params]);

    return (<>
        <h3>Tiling</h3>
        <LabelledSlider 
            lbl="Number of Sides" 
            min={3} max={maxSides} value={params[0].pValue}
            onChange={(val) => { 
                setPVal(val);
                setValues(val, qVal);
            }} />
        <LabelledSlider 
            lbl="Number of Polygons Around a Vertex" 
            min={3} max={maxSides} value={params[0].qValue}
            onChange={(val) => { 
                setQVal(val);
                setValues(pVal, val);
            }} />
        { hasError && (
            <Alert 
                message="This is not a valid hyperbolic tiling. Try changing the parameters." 
                type="error" />
        ) }
        <hr />
    </>);
}

/*
This is the Appearance section of the Settings menu.
*/

function AppearanceMenu() {
    const params = useContext(ParamContext);    
    return (
        <>
            <h3>Appearance</h3>
            <p>Model:</p>
            <Select 
                defaultValue={params[0].modelIdx} style={{ 
                    width: "100%", 
                    marginBottom: "var(--small-spacing)" }}
                options={modelNames} onChange={(val) => params[1]({...params[0], modelIdx: val})} />
            <LabelledToggle
                lbl="Show Polygon Edges" toggled={params[0].doEdges} 
                onChange={(toggled) => params[1]({...params[0], doEdges: toggled})} />
            <LabelledToggle
                lbl="Show Triangles" toggled={params[0].doParity} 
                onChange={(toggled) => params[1]({...params[0], doParity: toggled})} />
            <LabelledToggle
                lbl="Use Solid Color Background" toggled={params[0].doSolidColor} 
                onChange={(toggled) => params[1]({...params[0], doSolidColor: toggled})} />
            { params[0].doSolidColor && (<>
                <p>Select Color</p>
                <ColorPicker 
                    selIdx={params[0].colIdx} 
                    onChange={(idx) => params[1]({...params[0], colIdx: idx})}/>
            </>) }
            <hr />
        </>);
}

/*
This is the Rendering section of the settings menu.
*/

function RenderingMenu() {
    const params = useContext(ParamContext);   
    return (<>
        <h3>Rendering</h3>
        <LabelledSlider 
            lbl="Number of Iterations" min={20} max={100} value={params[0].nIterations}
            onChange={(val) => params[1]({...params[0], nIterations: val})} />
        <LabelledSlider
            lbl="Number of Antialiasing Steps" min={1} max={5} value={params[0].nSamples}
            onChange={(val) => params[1]({...params[0], nSamples: val})} />
    </>);
}

/*
This is the settings menu itself.
*/

function SettingsMenu(props) {
    return (
        <>
            <Drawer title="Settings" placement="left" width="35vw"
                onClose={props.onClose} open={props.isOpen} key="helpDrawer">
                    <TilingSelector />
                    <AppearanceMenu />
                    <RenderingMenu />
            </Drawer>
        </>);
}

export default SettingsMenu;