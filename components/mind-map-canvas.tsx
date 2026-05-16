'use client'
import { useRef, useEffect, useState } from 'react'
import { usePulsePlanStore, type MindMapNode } from '@/lib/store'

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 1000
const H = 700
const CX = 500
const CY = 355
const R1 = 178   // root ring radius
const R2 = 328   // child ring radius

export const CAT_COLOR: Record<string, string> = {
  Health:   '#10b981',
  Work:     '#3b82f6',
  Study:    '#8b5cf6',
  Social:   '#ec4899',
  Finance:  '#f59e0b',
  Creative: '#f97316',
  Personal: '#06b6d4',
}

function color(cat: string) {
  return CAT_COLOR[cat] ?? '#71717a'
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function layout(nodes: MindMapNode[]) {
  const pos: Record<string, { x: number; y: number; level: 0 | 1 | 2 }> = {}
  const roots = nodes.filter((n) => !n.parentId)
  const nr = roots.length
  if (nr === 0) return pos

  roots.forEach((root, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / nr
    pos[root.id] = { x: CX + R1 * Math.cos(a), y: CY + R1 * Math.sin(a), level: 1 }

    const kids = nodes.filter((n) => n.parentId === root.id)
    const nk = kids.length
    if (nk === 0) return

    const sector = (2 * Math.PI) / nr
    const pad = 0.3
    kids.forEach((kid, j) => {
      const t = nk === 1 ? 0.5 : j / (nk - 1)
      const ka = a - sector / 2 + pad + (sector - pad * 2) * t
      pos[kid.id] = { x: CX + R2 * Math.cos(ka), y: CY + R2 * Math.sin(ka), level: 2 }
    })
  })

  return pos
}

// ─── SVG primitives ───────────────────────────────────────────────────────────

function ProgressRing({
  cx, cy, r, progress, col, sw = 6,
}: {
  cx: number; cy: number; r: number; progress: number; col: string; sw?: number
}) {
  const ir = r - sw / 2
  const circ = 2 * Math.PI * ir
  const dash = Math.max(0, Math.min(1, progress / 100)) * circ

  return (
    <>
      <circle cx={cx} cy={cy} r={ir} fill="none" stroke="rgba(190,200,212,0.55)" strokeWidth={sw} />
      {progress > 0 && (
        <circle
          cx={cx} cy={cy} r={ir}
          fill="none"
          stroke={col}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90,${cx},${cy})`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
      )}
    </>
  )
}

function CurvedLine({
  x1, y1, x2, y2, col,
}: { x1: number; y1: number; x2: number; y2: number; col: string }) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  // Slight perpendicular curve
  const nx = -dy / len, ny = dx / len
  const cpx = (x1 + x2) / 2 + nx * len * 0.06
  const cpy = (y1 + y2) / 2 + ny * len * 0.06
  return (
    <path
      d={`M${x1} ${y1}Q${cpx} ${cpy} ${x2} ${y2}`}
      fill="none"
      stroke={col}
      strokeWidth={1.6}
      strokeOpacity={0.45}
    />
  )
}

function Node({
  node, x, y, selected, onClick,
}: {
  node: MindMapNode; x: number; y: number; selected: boolean; onClick: () => void
}) {
  const R = node.parentId ? 27 : 36
  const col = color(node.category)
  const label = node.title.length > 11 ? node.title.slice(0, 10) + '…' : node.title
  const sw = node.parentId ? 5 : 7

  // Neumorphic emboss filter id (defined in defs)
  const filterId = selected ? 'neumoSelected' : 'neumoNode'

  return (
    <g className="mind-node" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Outer glow when selected */}
      {selected && (
        <>
          <circle cx={x} cy={y} r={R + 14} fill={col} fillOpacity={0.12} />
          <circle cx={x} cy={y} r={R + 7} fill="none" stroke={col} strokeWidth={1.2} strokeOpacity={0.45} strokeDasharray="3 3" />
        </>
      )}

      {/* Neumorphic raised disc */}
      <circle cx={x} cy={y} r={R} fill="#E4E9F0" filter={`url(#${filterId})`} />

      {/* Inner color tint */}
      <circle cx={x} cy={y} r={R - sw} fill={col} fillOpacity={selected ? 0.18 : 0.08} />

      {/* Progress ring */}
      <ProgressRing cx={x} cy={y} r={R} progress={node.progress} col={col} sw={sw} />

      {/* Labels */}
      <text
        x={x} y={node.progress > 0 ? y - 5 : y}
        textAnchor="middle" dominantBaseline="middle"
        fill="#2d3748" fontSize={node.parentId ? 9 : 10} fontWeight="600"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
      {node.progress > 0 && (
        <text
          x={x} y={y + 7}
          textAnchor="middle"
          fill={col} fontSize={8} fontWeight="700"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.progress}%
        </text>
      )}
    </g>
  )
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function MindMapCanvas({ selectedId, onSelect }: Props) {
  const nodes = usePulsePlanStore((s) => s.mindMapNodes)
  const svgRef = useRef<SVGSVGElement>(null)

  const [tfm, setTfm] = useState({ x: 0, y: 0, scale: 1 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  // Non-passive wheel for zoom
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const d = e.deltaY > 0 ? 0.93 : 1.07
      setTfm((t) => ({ ...t, scale: Math.max(0.35, Math.min(3, t.scale * d)) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as Element).closest('.mind-node')) return
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }
  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging.current) return
    setTfm((t) => ({
      ...t,
      x: t.x + (e.clientX - last.current.x),
      y: t.y + (e.clientY - last.current.y),
    }))
    last.current = { x: e.clientX, y: e.clientY }
  }
  function onMouseUp() { dragging.current = false }

  const pos = layout(nodes)
  const roots = nodes.filter((n) => !n.parentId)

  // Zoom from canvas center
  const tfmStr = `translate(${CX + tfm.x},${CY + tfm.y}) scale(${tfm.scale}) translate(${-CX},${-CY})`

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={(e) => {
        if ((e.target as Element).closest('.mind-node')) return
        onSelect(null)
      }}
    >
      <defs>
        <radialGradient id="mmBg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#EEF2F7" />
          <stop offset="100%" stopColor="#D8DEE7" />
        </radialGradient>
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.8" fill="rgba(190,200,212,0.45)" />
        </pattern>

        {/* Neumorphic emboss for nodes */}
        <filter id="neumoNode" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="3" dy="3" result="offsetDark" />
          <feFlood floodColor="#BEC8D4" floodOpacity="0.85" result="darkColor" />
          <feComposite in="darkColor" in2="offsetDark" operator="in" result="darkShadow" />
          <feOffset in="blur" dx="-3" dy="-3" result="offsetLight" />
          <feFlood floodColor="#FFFFFF" floodOpacity="0.95" result="lightColor" />
          <feComposite in="lightColor" in2="offsetLight" operator="in" result="lightShadow" />
          <feMerge>
            <feMergeNode in="darkShadow" />
            <feMergeNode in="lightShadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neumoSelected" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
          <feOffset in="blur" dx="4" dy="4" result="offsetDark" />
          <feFlood floodColor="#BEC8D4" floodOpacity="0.9" result="darkColor" />
          <feComposite in="darkColor" in2="offsetDark" operator="in" result="darkShadow" />
          <feOffset in="blur" dx="-4" dy="-4" result="offsetLight" />
          <feFlood floodColor="#FFFFFF" floodOpacity="1" result="lightColor" />
          <feComposite in="lightColor" in2="offsetLight" operator="in" result="lightShadow" />
          <feMerge>
            <feMergeNode in="darkShadow" />
            <feMergeNode in="lightShadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="url(#mmBg)" />
      <rect width={W} height={H} fill="url(#grid)" />

      <g transform={tfmStr}>
        {/* Center hub — Neumorphic raised */}
        <circle cx={CX} cy={CY} r={26} fill="#E4E9F0" filter="url(#neumoNode)" />
        <circle cx={CX} cy={CY} r={20} fill="rgba(102,126,234,0.15)" />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#667eea" fontSize={6.8} fontWeight="800" letterSpacing="0.8" style={{ userSelect: 'none' }}>PULSE</text>
        <text x={CX} y={CY + 5} textAnchor="middle" fill="#764ba2" fontSize={5.8} letterSpacing="0.4" style={{ userSelect: 'none' }}>PLAN</text>

        {/* Center → root lines */}
        {roots.map((root) => {
          const p = pos[root.id]
          if (!p) return null
          return (
            <CurvedLine key={`c-${root.id}`}
              x1={CX} y1={CY} x2={p.x} y2={p.y} col={color(root.category)}
            />
          )
        })}

        {/* Root → child lines */}
        {nodes.filter((n) => n.parentId).map((child) => {
          const parent = nodes.find((n) => n.id === child.parentId)
          const cp = pos[child.id], pp = parent ? pos[parent.id] : null
          if (!cp || !pp) return null
          return (
            <CurvedLine key={`l-${child.id}`}
              x1={pp.x} y1={pp.y} x2={cp.x} y2={cp.y} col={color(child.category)}
            />
          )
        })}

        {/* Render children first (under roots) */}
        {nodes.filter((n) => n.parentId).map((node) => {
          const p = pos[node.id]
          if (!p) return null
          return (
            <Node key={node.id} node={node} x={p.x} y={p.y}
              selected={selectedId === node.id}
              onClick={() => onSelect(selectedId === node.id ? null : node.id)}
            />
          )
        })}

        {/* Roots on top */}
        {roots.map((node) => {
          const p = pos[node.id]
          if (!p) return null
          return (
            <Node key={node.id} node={node} x={p.x} y={p.y}
              selected={selectedId === node.id}
              onClick={() => onSelect(selectedId === node.id ? null : node.id)}
            />
          )
        })}
      </g>

      {/* Legend */}
      <g transform="translate(16, 16)">
        <text y={0} fill="rgba(113,128,150,0.7)" fontSize={9} fontWeight="600" letterSpacing="0.5">
          Scroll to zoom · Drag to pan · Click node to inspect
        </text>
      </g>
    </svg>
  )
}
