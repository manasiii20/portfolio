// StickyBoard — the three draggable sticky notes from the portfolio hero.
//
// How to use in Framer:
//   1. Assets panel → Code → "+" → New component → name it StickyBoard.
//   2. Replace everything in the file with this code and save.
//   3. Drag "StickyBoard" onto the canvas. Its frame is 500 × 370 by default;
//      resize it and the notes scale together.
//   4. Edit text, colours and the lego image in the right-hand panel.
//
// The notes can be dragged anywhere. They tilt a little on hover, lift while
// dragged, and settle down perfectly straight once dropped. On page load they
// swing in from a big tilt and spring back, like the stickies on the live site.

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const FONTS =
    "https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Geist+Mono:wght@300;400&display=swap"

const SHADOW = "0px 22px 15px -15.4px rgba(193, 192, 204, 0.28)"
const SHADOW_DRAG = "0px 24.5px 13.7px -13.6px rgba(40, 30, 150, 0.35)"

// springy settle with a hair of overshoot, like the hover on the live site
const HOVER_SPRING = { type: "spring", stiffness: 320, damping: 20 }
// big swing on entry: overshoots about a third of the way past, then settles
const ENTRY_SPRING = { type: "spring", stiffness: 140, damping: 9 }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 370
 */
export default function StickyBoard(props) {
    const {
        cardText,
        cardColor,
        cardTextColor,
        photo,
        photoColor,
        playText,
        playHighlight,
        playEnd,
        playColor,
        playTextColor,
        playCornerColor,
        highlightColor,
        animateIn,
        settleOnDrop,
        style,
    } = props

    // everything is drawn on a 500 × 370 board and scaled to the frame's width
    const boardRef = useRef(null)
    const [u, setU] = useState(1)
    useEffect(() => {
        const el = boardRef.current
        if (!el) return
        const measure = () => setU(el.offsetWidth / 500 || 1)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const playEntry = animateIn && !onCanvas
    // the note you pick up comes to the front
    const topZ = useRef(10)
    const raise = () => ++topZ.current

    return (
        <div
            ref={boardRef}
            style={{ position: "relative", width: "100%", height: "100%", ...style }}
        >
            <link rel="stylesheet" href={FONTS} />

            {/* ---- big notebook card ---- */}
            <Note
                u={u}
                left={75}
                top={22}
                width={284}
                height={186}
                rest={-5.5}
                hover={-3}
                drag={-1}
                lift={1.03}
                liftDrag={1.06}
                spin={40}
                delay={0.9}
                playEntry={playEntry}
                settleOnDrop={settleOnDrop}
                raise={raise}
                background={cardColor}
            >
                {/* punched holes along the top */}
                <div
                    style={{
                        position: "absolute",
                        top: 14 * u,
                        left: 24 * u,
                        right: 24 * u,
                        height: 9 * u,
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} style={{ width: 9 * u, height: 9 * u, background: "#fff" }} />
                    ))}
                </div>
                <p
                    style={{
                        margin: 0,
                        padding: `${42 * u}px ${26 * u}px 0`,
                        fontFamily: '"Gaegu", "Comic Sans MS", cursive',
                        fontSize: 21 * u,
                        lineHeight: `${31 * u}px`,
                        letterSpacing: "0.02em",
                        color: cardTextColor,
                        whiteSpace: "pre-line",
                        // ruled lines sit just under each line of writing
                        backgroundImage: `linear-gradient(to bottom, transparent ${25.5 * u}px, rgba(255,255,255,0.3) ${25.5 * u}px ${27 * u}px, transparent ${27 * u}px)`,
                        backgroundSize: `100% ${31 * u}px`,
                        backgroundOrigin: "content-box",
                        backgroundClip: "content-box",
                    }}
                >
                    {cardText}
                </p>
            </Note>

            {/* ---- lego photo note ---- */}
            <Note
                u={u}
                left={381}
                top={97}
                width={120}
                height={120}
                rest={0}
                hover={4}
                drag={7}
                spin={-34}
                delay={1}
                playEntry={playEntry}
                settleOnDrop={settleOnDrop}
                raise={raise}
                background={photoColor}
                center
            >
                {photo?.src && (
                    <img
                        src={photo.src}
                        srcSet={photo.srcSet}
                        alt={photo.alt || ""}
                        draggable={false}
                        style={{ width: 58 * u, height: "auto", pointerEvents: "none" }}
                    />
                )}
            </Note>

            {/* ---- play area note with a folded corner ---- */}
            <Note
                u={u}
                left={192}
                top={230}
                width={281}
                height={122}
                rest={3}
                hover={6}
                drag={9}
                spin={30}
                delay={1.1}
                playEntry={playEntry}
                settleOnDrop={settleOnDrop}
                raise={raise}
                background="transparent"
            >
                {/* the paper, with its bottom-right corner cut away */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: playColor,
                        clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${30 * u}px), calc(100% - ${30 * u}px) 100%, 0 100%)`,
                    }}
                />
                {/* the corner folded over */}
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        width: 30 * u,
                        height: 30 * u,
                        background: playCornerColor,
                        clipPath: "polygon(0 0, 100% 0, 0 100%)",
                    }}
                />
                <p
                    style={{
                        position: "relative",
                        margin: 0,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        padding: `0 ${14 * u}px ${4 * u}px ${22 * u}px`,
                        fontFamily: '"Geist Mono", ui-monospace, monospace',
                        fontWeight: 300,
                        fontSize: 14 * u,
                        lineHeight: 1.5,
                        color: playTextColor,
                        whiteSpace: "pre-line",
                    }}
                >
                    <span>
                        {playText}
                        <span style={{ whiteSpace: "nowrap" }}>
                            <span style={{ background: highlightColor, padding: "0 0.15em" }}>
                                {playHighlight}
                            </span>
                            {playEnd}
                        </span>
                    </span>
                </p>
            </Note>
        </div>
    )
}

// One draggable note. Sizes are in board units (1 unit = 1px at 500px wide).
function Note({
    u,
    left,
    top,
    width,
    height,
    rest,
    hover,
    drag,
    lift = 1.05,
    liftDrag = 1.1,
    spin,
    delay,
    playEntry,
    settleOnDrop,
    raise,
    background,
    center = false,
    children,
}) {
    const [isHover, setHover] = useState(false)
    const [isDragging, setDragging] = useState(false)
    const [settled, setSettled] = useState(false)
    const [z, setZ] = useState(3)
    // during the entry swing the entry spring drives rotation; afterwards the hover spring does
    const [entered, setEntered] = useState(!playEntry)
    useEffect(() => {
        if (!playEntry) return
        const t = setTimeout(() => setEntered(true), (delay + 1.4) * 1000)
        return () => clearTimeout(t)
    }, [playEntry, delay])

    // once a note has been picked up and dropped, it settles down straight
    const restAngle = settled ? 0 : rest
    const hoverAngle = settled ? 0 : hover
    const rotate = isDragging ? drag : isHover ? hoverAngle : restAngle
    const scale = isDragging ? liftDrag : isHover ? lift : 1

    const transition = entered
        ? { ...HOVER_SPRING, boxShadow: { duration: 0.3 } }
        : {
              rotate: { ...ENTRY_SPRING, delay },
              y: { ...ENTRY_SPRING, delay },
              opacity: { duration: 0.25, delay },
              scale: HOVER_SPRING,
              boxShadow: { duration: 0.3 },
          }

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={playEntry ? { opacity: 0, rotate: rest + spin, y: 24 } : false}
            animate={{
                opacity: 1,
                y: 0,
                rotate,
                scale,
                boxShadow: isDragging ? SHADOW_DRAG : SHADOW,
            }}
            transition={transition}
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
            onDragStart={() => {
                setEntered(true)
                setDragging(true)
                setZ(raise())
            }}
            onDragEnd={() => {
                setDragging(false)
                if (settleOnDrop) setSettled(true)
            }}
            style={{
                position: "absolute",
                left: left * u,
                top: top * u,
                width: width * u,
                height: height * u,
                background,
                zIndex: z,
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
                userSelect: "none",
                display: center ? "grid" : "block",
                placeItems: center ? "center" : undefined,
            }}
        >
            {children}
        </motion.div>
    )
}

StickyBoard.defaultProps = {
    cardText:
        "Manasi, prev @Bosch,\nis a designer who believes the real craft lies in the thinking.",
    cardColor: "#3A7CF0",
    cardTextColor: "#FFFFFF",
    photo: {
        src: "https://framerusercontent.com/images/rTCMVMsJuZQCa3NajZ9uydPaiVY.png",
        alt: "A lego version of Manasi holding a tablet, next to a potted flower",
    },
    photoColor: "#FAF0D1",
    playText: "She's currently in\nher play area building\n",
    playHighlight: "hello, i'm_",
    playEnd: " :)",
    playColor: "#E1EAFD",
    playTextColor: "#135FEC",
    playCornerColor: "#135FEC",
    highlightColor: "#FFF3C2",
    animateIn: true,
    settleOnDrop: true,
}

addPropertyControls(StickyBoard, {
    cardText: { type: ControlType.String, title: "Card text", displayTextArea: true },
    cardColor: { type: ControlType.Color, title: "Card" },
    cardTextColor: { type: ControlType.Color, title: "Card text colour" },
    photo: { type: ControlType.ResponsiveImage, title: "Lego photo" },
    photoColor: { type: ControlType.Color, title: "Photo note" },
    playText: { type: ControlType.String, title: "Play note text", displayTextArea: true },
    playHighlight: { type: ControlType.String, title: "Highlighted bit" },
    playEnd: { type: ControlType.String, title: "Ending" },
    playColor: { type: ControlType.Color, title: "Play note" },
    playTextColor: { type: ControlType.Color, title: "Play note text colour" },
    playCornerColor: { type: ControlType.Color, title: "Folded corner" },
    highlightColor: { type: ControlType.Color, title: "Highlight" },
    animateIn: { type: ControlType.Boolean, title: "Swing in on load", defaultValue: true },
    settleOnDrop: { type: ControlType.Boolean, title: "Straighten on drop", defaultValue: true },
})
