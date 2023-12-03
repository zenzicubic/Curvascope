/**
 * This is the main app component. It manages the canvas and all interaction
 * and animation directly, and calls components for everything else.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

import './App.css';

import { useRef, useState, useEffect, useCallback, createContext } from 'react';
import { WebGLRenderer, Scene, OrthographicCamera, Vector2, Vector3, 
         ShaderMaterial, PlaneGeometry, GLSL3, Mesh } from 'three';

import ScreenError from './menus/ScreenError/ScreenError.js';
import TopbarMenu from './menus/TopbarMenu/TopbarMenu.js';
import HelpMenu from './menus/HelpMenu/HelpMenu.js';
import SettingsMenu from './menus/SettingsMenu/SettingsMenu.js';
import { colors } from './menus/SettingsMenu/colorpicker/ColorPicker.js';
import { Complex, generateTilingParams, modelMaps } from './math.js'; 

// Assorted constants
const timeFactor = 2e-4;
const minWidth = 768;
const ZERO = new Complex(0, 0);

// Lists of parameters to share and copy
const sharedParams = ["modelIdx", "doEdges", "doParity", "doSolidColor", "colIdx", "pValue", "qValue"];
const uniformNames = ["doEdges", "doParity", "doSolidColor", "modelIdx", "doAntialias", "nIterations", "invRad"];

const ParamContext = createContext();

function App() {
    // Parameters
    const [params, setParams] = useState({
        pValue: 5,
        qValue: 5,
        nIterations: 50,
        colIdx: 0,
        modelIdx: 0,
        doAntialias: true,
        doEdges: true,
        doSolidColor: false,
        doParity: false,
        invCen: ZERO,
        invRad: 0,
        refNrm: ZERO
    });

    // Menus
    const [helpOpen, setHelpOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Elements
    const parentRef = useRef(null);
    const canvasRef = useRef(null);

    // Three components, shader, and uniforms
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const [fragmentShader, setShader] = useState(null);

    const uniformsRef = useRef({
        tileCol: {value: new Vector3()},
        resolution: {value: new Vector2()},
        refNrm: {value: new Vector2()},
        mousePos: {value: new Vector2(0, 0)},
        invCen: {value: new Vector2()},
        time: {value: 0},
        scale: {value: 0},
        invRad: {value: 0},
        modelIdx: {value: 0},
        nIterations: {value: 0},
        doEdges: {value: false},
        doSolidColor: {value: false},
        doParity: {value: false},
        doAntialias: {value: false}
    });
    
    // Window size and mouse things
    const isMobile = useRef(false);
    const [size, setSize] = useState(ZERO);
    const [scale, setScale] = useState(0);
    const [isDragging, setDragging] = useState(false);
    
    // Animation frame things
    const prevTime = useRef(0);
    const timeVal = useRef(0);
    const frameRef = useRef(null)

    /*
    Utility functions.
    */

    // Sets a uniform's value 
    const setUniform = (name, val) => { uniformsRef.current[name].value = val; }

    // Sets a 2D vector uniform's value
    const setVector2Uniform = (name, v) => { uniformsRef.current[name].value.set(v.x, v.y); }

    // Sets a 3D vector uniform's value
    const setVector3Uniform = (name, x, y, z) => { uniformsRef.current[name].value.set(x, y, z); }

    /*
    Saving the canvas to an image.
    */
   
    const downloadTiling = useCallback(() => {
        let dataUrl = canvasRef.current.toDataURL();
        let link = document.createElement("a");

        link.setAttribute("download", "tiling.png");
        link.setAttribute("href", dataUrl);
        link.click();
    }, [canvasRef]);

    /*
    Loading and saving tilings by URL.
    */

    const copyShareableLink = useCallback(() => {
        // Copy a shareable link to the clipboard
        let dat = {};
        for (let param of sharedParams) {
            dat[param] = params[param];
        }
        navigator.clipboard.writeText(window.location.origin + "#" + btoa(JSON.stringify(dat)));   
    }, [params]);

    const loadLinkIfAny = useCallback(() => {
        // Check if URL contains data
        let tokens = window.location.href.split("#");
        if (tokens.length > 1) {
            try {
                // Extract it if possible
                let dat = JSON.parse(atob(tokens[1]));
                setParams(prevParams => ({...prevParams, ...dat}));
            } catch(e) {
                console.error("Incorrectly formatted link");
            }
        }
    }, []);

    /*
    Main animation frame.
    */

    const mainLoop = useCallback((time) => {
        // Get time delta since last frame update
        let delta = 0;
        if (prevTime.current) {
            delta = time - prevTime.current;
        }
        prevTime.current = time;

        // Rerender the scene every frame
        setUniform("time", timeVal.current);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        // Update time
        timeVal.current = (timeVal.current + timeFactor * delta) % 1;
        frameRef.current = requestAnimationFrame(mainLoop);
    }, []);

    /*
    Resize logic.
    */

    const setCanvasSize = useCallback((width, height) => {
        // Get size
        if (!rendererRef.current) {
            return;
        }
        let sizeVec = new Complex(width, height);
        let nScale = Math.min(width, height);

        // Set uniforms
        rendererRef.current.setSize(width, height);
        setVector2Uniform("resolution", sizeVec);
        setUniform("scale", nScale);
        setScale(nScale);
        setSize(sizeVec);
    }, [rendererRef]);

    const checkScreenSize = useCallback(() => {
        if (window.innerWidth < minWidth) {
            isMobile.current = true;
            cancelAnimationFrame(frameRef.current);
        } else {
            if (isMobile.current) {
                frameRef.current = requestAnimationFrame(mainLoop);
            }
            isMobile.current = false;
        }
    }, [mainLoop]);

    /*
    Mouse handlers.
    */

    const getMouseCoord = (evt) => {
        // Get touch if event is a touchscreen
        if (evt.touches && evt.touches.length > 0) {
            evt = evt.touches.item(0);
        }
        
        // Gets the mouse position relative to the canvas
        let rect = canvasRef.current.getBoundingClientRect();
        return new Complex(
            evt.clientX - rect.left,
            evt.clientY - rect.top);
    }

    // Start dragging on click or touch
    const onInteractionStart = () => { setDragging(true); }

    const onInteractionMove = useCallback((evt) => {
        // Update the display when the mouse is moved
        evt.preventDefault();
        if (!isDragging) {
            return;
        }

        // Remap mouse position to screen
        let modelMap = modelMaps[params.modelIdx];
        let currPos = getMouseCoord(evt);
        let scrnPos = new Complex(
            (2 * currPos.x - size.x) / scale,
            (size.y - 2 * currPos.y) / scale);
        let diskPos = modelMap(scrnPos);

        // Update disk position
        if (diskPos.normSq() <= 1) {
            setVector2Uniform("mousePos", diskPos);
        } else { 
            endInteraction();
        }
    }, [isDragging, scale, size, params]);
    
    // Stop dragging when the user releases the mouse
    const endInteraction = () => { setDragging(false); }

    /*
    First useEffect: add resize listeners, prepare tiling, and load shader.
    */

    const initialize = useCallback(() => {
        // Add resize observer
        const observer = new ResizeObserver((entries) => {
            let newBox = entries[0].contentRect;
            setCanvasSize(newBox.width, newBox.height);
        });
        window.addEventListener("resize", checkScreenSize);
        observer.observe(parentRef.current);
        loadLinkIfAny();

        // Initialize tiling parameters
        setParams(paras => ({
            ...paras, 
            ...generateTilingParams(paras.pValue, paras.qValue)
        }));

        // Load shader
        fetch("shader.glsl")
            .then(resp => resp.text())
            .then(resp => setShader(resp));
        
        // Remove event listeners
        return () => {
            window.removeEventListener("resize", checkScreenSize);
            observer.unobserve(parentRef.current);
        }
    }, [setCanvasSize, checkScreenSize, loadLinkIfAny]);

    /*
    Second useEffect: build shader.
    */

    const prepareThree = useCallback(() => {
        // Check if shader is loaded
        checkScreenSize();
        if (!fragmentShader) {
            return;
        }

        // Initialize Three components
        rendererRef.current = new WebGLRenderer({
            canvas: canvasRef.current,
            preserveDrawingBuffer: true
        });
        sceneRef.current = new Scene();
        cameraRef.current = new OrthographicCamera(-1, 1, 1, -1, -1, 1);

        // Build shader and plane
        let mat = new ShaderMaterial({
            fragmentShader, 
            uniforms: uniformsRef.current,
            glslVersion: GLSL3
        });
        let pln = new PlaneGeometry(2, 2);
        sceneRef.current.add(new Mesh(pln, mat));

        // Set initial size and run if screen is big enough
        if (!isMobile.current) {
            let box = parentRef.current.getBoundingClientRect();
            setCanvasSize(box.width, box.height);
            mainLoop();
        }
    }, [setCanvasSize, mainLoop, checkScreenSize, isMobile, fragmentShader]);

    /*
    Third useEffect: update uniforms.
    */

    const updateUniforms = useCallback(() => {
        // Updates the uniforms
        for (let name of uniformNames) {
            setUniform(name, params[name]);
        }
        setVector2Uniform("refNrm", params.refNrm);
        setVector2Uniform("invCen", params.invCen);

        // Get preset color
        let col = colors[params.colIdx];
        setVector3Uniform("tileCol", col[0] / 255, col[1] / 255, col[2] / 255);
    }, [params]);

    // Add useEffects
    useEffect(initialize, [initialize]);
    useEffect(prepareThree, [prepareThree]);
    useEffect(updateUniforms, [updateUniforms]);

    return (
        <ParamContext.Provider value={[params, setParams]}>
            <HelpMenu 
                isOpen={helpOpen} onClose={() => { setHelpOpen(false); }} />
            <SettingsMenu 
                isOpen={settingsOpen} onClose={() => { setSettingsOpen(false); }} />
            <ScreenError />
            <div id="app-parent">
                <TopbarMenu 
                    onHelp={() => { setHelpOpen(true); }} onSettings={()=>{ setSettingsOpen(true); }}
                    onSaveImg={downloadTiling} onShare={copyShareableLink}/>
                <div id="canvas-container" ref={parentRef}>
                    <canvas id="main-canvas" className={(isDragging ? "dragging" : "")} ref={canvasRef} 
                    onMouseDown={onInteractionStart} onTouchStart={onInteractionStart}
                    onMouseMove={onInteractionMove} onTouchMove={onInteractionMove}
                    onMouseUp={endInteraction} onMouseOut={endInteraction} 
                    onTouchEnd={endInteraction} onTouchCancel={endInteraction}></canvas>
                </div>
            </div>
        </ParamContext.Provider>
    )
}

export default App;
export { ParamContext };