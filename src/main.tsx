import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ToastProvider } from './components/ui/Toast'
import './styles/base.css'
import './styles/components.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Ambient colour and grain for the glass to refract. */}
    <div className="backdrop" aria-hidden="true" />
    {/* Displacement filter: bends the backdrop behind the glass surfaces. */}
    <svg className="glass-defs" aria-hidden="true" focusable="false">
      <filter
        id="hallowmarsh-refraction"
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.007 0.012"
          numOctaves={2}
          seed={9}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={1.5} result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={18}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
