import type { ReactNode } from 'react'
import { ZONE_GRID } from '../constants'
import type { ZoneCell } from '../types'

interface ZoneFrameProps {
  renderCell: (cell: ZoneCell) => ReactNode
}

const topRow = ZONE_GRID[0]
const bottomRow = ZONE_GRID[4]
const leftCol = [ZONE_GRID[1][0], ZONE_GRID[2][0], ZONE_GRID[3][0]]
const rightCol = [ZONE_GRID[1][4], ZONE_GRID[2][4], ZONE_GRID[3][4]]
const strikeCells = ZONE_GRID.slice(1, 4).flatMap((row) => row.slice(1, 4))

export function ZoneFrame({ renderCell }: ZoneFrameProps) {
  return (
    <div className="zone-frame">
      <div className="zone-frame-top">{topRow.map(renderCell)}</div>

      <div className="zone-frame-body">
        <div className="zone-frame-side">{leftCol.map(renderCell)}</div>

        <div className="strike-zone-box">
          <div className="strike-zone-grid">{strikeCells.map(renderCell)}</div>
        </div>

        <div className="zone-frame-side">{rightCol.map(renderCell)}</div>
      </div>

      <div className="zone-frame-bottom">{bottomRow.map(renderCell)}</div>
    </div>
  )
}
