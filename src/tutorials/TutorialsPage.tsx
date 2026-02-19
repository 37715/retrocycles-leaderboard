"use client";

import { useState } from "react";
import { PrimaryNav } from "@/src/ui/PrimaryNav";

const koalaCamera = [
  "ZONE_HEIGHT 2",
  "ZONE_SEGMENTS 22",
  "ZONE_ALPHA 0.2",
  "CAMERA_CUSTOM_RISE 19.5",
  "CAMERA_CUSTOM_BACK 20",
  "CAMERA_CUSTOM_PITCH -0.75",
  "CAMERA_GLANCE_BACK 20",
  "CAMERA_GLANCE_RISE 19.5",
  "CAMERA_GLANCE_PITCH -0.75",
  "START_FOV_1 85",
  "MAX_IN_RATE 512",
  "MAX_OUT_RATE 512"
];

const ellisCamera = [
  "zone_seg_length 0.2",
  "zone_height 0.5",
  "ZONE_SEGMENTS 22",
  "zone_alpha 0.2",
  "camera_custom_rise 34",
  "camera_custom_back 44",
  "camera_custom_pitch -0.7",
  "camera_glance_rise 53",
  "camera_glance_back 58",
  "camera_glance_pitch -0.75",
  "start_fov_1 50",
  "MAX_IN_RATE 512",
  "MAX_OUT_RATE 512",
  "axes_indicator 1"
];

function CopyButton({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-button"
      type="button"
      onClick={async () => {
        const text = lines.join("\n");
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // no-op
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

export function TutorialsPage() {
  return (
    <div className="container">
      <PrimaryNav active="tutorials" />
      <header className="header">
        <div className="title-section">
          <h1 className="title">tutorials</h1>
        </div>
        <p className="subtitle">learn the game mechanics and strategies</p>
      </header>

      <div className="main-content">
        <div className="page-content">
          <div className="tutorials-categories">
            <details className="tutorial-category">
              <summary className="category-summary">
                <span className="category-title">game setup</span>
                <span className="category-description">camera, graphics, binds</span>
                <span className="category-toggle">+</span>
              </summary>
              <div className="category-content">
                <div className="category-intro account-creation">
                  <h3>account creation</h3>
                  <p>to play ranked matches you need an account to login to in-game.</p>
                  <a className="account-link" href="https://retrocyclesleague.com/" target="_blank" rel="noopener noreferrer">
                    retrocyclesleague.com
                  </a>
                </div>
                <div className="category-intro">
                  <h3>camera</h3>
                  <p>having a good camera is very important for retrocycles. fortress players benefit more from a wider lens with a greater look-ahead.</p>
                </div>
                <div className="camera-grid">
                  <div className="camera-card">
                    <div className="camera-image">
                      <img src="/images/campreviews/koala.png" alt="koala's camera" />
                    </div>
                    <div className="camera-info">
                      <h4>koala&apos;s camera</h4>
                      <div className="camera-command">
                        <CopyButton lines={koalaCamera} />
                        {koalaCamera.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="camera-card">
                    <div className="camera-image">
                      <img src="/images/campreviews/ellis.png" alt="ellis' camera" />
                    </div>
                    <div className="camera-info">
                      <h4>ellis&apos; camera</h4>
                      <div className="camera-command">
                        <CopyButton lines={ellisCamera} />
                        {ellisCamera.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="wall-grid">
                  <div className="wall-card">
                    <div className="wall-image">
                      <img src="/images/campreviews/koalawall.png" alt="koala wall preview" />
                    </div>
                    <div className="wall-info">
                      <h4>koala&apos;s wall</h4>
                      <p>well balanced wall with a clean aesthetic and reliable contrast.</p>
                      <div className="wall-download-row">
                        <a className="wall-download" href="/images/walltextures/koala/dir_wall.png" download>
                          download texture
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="wall-card">
                    <div className="wall-image">
                      <img src="/images/campreviews/elliswall.png" alt="ellis wall preview" />
                    </div>
                    <div className="wall-info">
                      <h4>ellis&apos; wall</h4>
                      <p>darker glossy translucent wall that keeps the arena calm and readable.</p>
                      <div className="wall-download-row">
                        <a className="wall-download" href="/images/walltextures/ellis/dir_wall.png" download>
                          download texture
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="wall-card">
                    <div className="wall-image">
                      <img src="/images/campreviews/synwall.png" alt="syn wall preview" />
                    </div>
                    <div className="wall-info">
                      <h4>syn&apos;s wall</h4>
                    </div>
                  </div>
                </div>
                <div className="bind-card">
                  <div className="bind-title">homerow regular</div>
                  <div className="bind-image">
                    <img src="/images/binds/1.png" alt="beginner keybind setup" />
                  </div>
                </div>
                <div className="bind-card">
                  <div className="bind-title">homerow piano</div>
                  <div className="bind-image">
                    <img src="/images/binds/2.png" alt="homerow piano binds" />
                  </div>
                </div>
                <div className="bind-card">
                  <div className="bind-title">ellis piano</div>
                  <div className="bind-image">
                    <img src="/images/binds/3.png" alt="ellis binds" />
                  </div>
                </div>
              </div>
            </details>
            <details className="tutorial-category is-disabled">
              <summary className="category-summary is-disabled" onClick={(e) => e.preventDefault()}>
                <span className="category-title">basic</span>
                <span className="category-description">movement, survival, awareness</span>
                <span className="category-toggle">+</span>
              </summary>
            </details>
            <details className="tutorial-category is-disabled">
              <summary className="category-summary is-disabled" onClick={(e) => e.preventDefault()}>
                <span className="category-title">advanced</span>
                <span className="category-description">timing, traps, competitive play</span>
                <span className="category-toggle">+</span>
              </summary>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
