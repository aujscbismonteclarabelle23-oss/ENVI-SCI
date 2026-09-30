import React, { useEffect, useState } from "react";
import "./dashboard.css";

import { onValue, ref } from "firebase/database";
import { database } from "../firebase/firebaseConfig";

type NodeId = "NODE 1" | "NODE 2";

type NodeData = {
  id: NodeId;
  location: string;
  temperature: number;
  humidity: number;
  pressure: number;
  airQuality: "Good" | "Moderate";
  particulateMatter: number;
  status: "Normal" | "Warning";
};

type HistoryData = {
  temperature: number[];
  humidity: number[];
  pressure: number[];
  particulateMatter: number[];
};

type FirebaseNodeData = {
  location?: string;
  temperature?: number | string;
  humidity?: number | string;
  pressure?: number | string;
  particulateMatter?: number | string;
};

const toNumber = (
  value: number | string | undefined,
  fallback = 0
): number => {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : fallback;
};

const getAirQuality = (
  particulateMatter: number
): "Good" | "Moderate" => {
  return particulateMatter <= 25 ? "Good" : "Moderate";
};

const getStatus = (
  particulateMatter: number
): "Normal" | "Warning" => {
  return particulateMatter <= 25 ? "Normal" : "Warning";
};

const createNodeData = (
  id: NodeId,
  data: FirebaseNodeData
): NodeData => {
  const particulateMatter = toNumber(data.particulateMatter);

  return {
    id,
    location:
      data.location ??
      (id === "NODE 1"
        ? "Main Entrance"
        : "Laboratory Area"),
    temperature: toNumber(data.temperature),
    humidity: toNumber(data.humidity),
    pressure: toNumber(data.pressure),
    particulateMatter,
    airQuality: getAirQuality(particulateMatter),
    status: getStatus(particulateMatter),
  };
};

export default function IndexWeb() {
  const [nodes, setNodes] = useState<NodeData[]>([]);

  const [history, setHistory] =
    useState<Record<NodeId, HistoryData>>({
      "NODE 1": {
        temperature: [],
        humidity: [],
        pressure: [],
        particulateMatter: [],
      },

      "NODE 2": {
        temperature: [],
        humidity: [],
        pressure: [],
        particulateMatter: [],
      },
    });

  const [selectedNode, setSelectedNode] =
    useState<NodeId>("NODE 1");

  const [darkMode, setDarkMode] = useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [loading, setLoading] =
    useState(true);

  const [firebaseError, setFirebaseError] =
    useState<string | null>(null);

  /* --------------------------------
     FIREBASE REAL-TIME DATA
  -------------------------------- */

  useEffect(() => {
    const nodesRef = ref(database, "Nodes");

    const unsubscribe = onValue(
      nodesRef,
      (snapshot) => {
        try {
          const data = snapshot.val();

          if (!data) {
            setNodes([]);
            setLoading(false);
            setFirebaseError(
              "No node data was found in Firebase."
            );
            return;
          }

          const node1Data =
            (data["Node 1"] ?? {}) as FirebaseNodeData;

          const node2Data =
            (data["Node 2"] ?? {}) as FirebaseNodeData;

          const node1 = createNodeData(
            "NODE 1",
            node1Data
          );

          const node2 = createNodeData(
            "NODE 2",
            node2Data
          );

          setNodes([node1, node2]);

          setHistory((previous) => {
            const updateHistoryForNode = (
              currentNode: NodeData,
              previousHistory: HistoryData
            ): HistoryData => {
              const maxHistory = 10;

              return {
                temperature: [
                  ...previousHistory.temperature,
                  currentNode.temperature,
                ].slice(-maxHistory),

                humidity: [
                  ...previousHistory.humidity,
                  currentNode.humidity,
                ].slice(-maxHistory),

                pressure: [
                  ...previousHistory.pressure,
                  currentNode.pressure,
                ].slice(-maxHistory),

                particulateMatter: [
                  ...previousHistory.particulateMatter,
                  currentNode.particulateMatter,
                ].slice(-maxHistory),
              };
            };

            return {
              "NODE 1": updateHistoryForNode(
                node1,
                previous["NODE 1"]
              ),

              "NODE 2": updateHistoryForNode(
                node2,
                previous["NODE 2"]
              ),
            };
          });

          setLastUpdated(new Date());

          setFirebaseError(null);

          setLoading(false);
        } catch (error) {
          console.error(
            "Firebase data error:",
            error
          );

          setFirebaseError(
            "Unable to process Firebase node data."
          );

          setLoading(false);
        }
      },

      (error) => {
        console.error(
          "Firebase connection error:",
          error
        );

        setFirebaseError(
          "Unable to connect to Firebase."
        );

        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  /* --------------------------------
     DARK MODE
  -------------------------------- */

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark-mode",
      darkMode
    );

    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    return () => {
      document.documentElement.classList.remove(
        "dark-mode"
      );

      document.body.classList.remove(
        "dark-mode"
      );
    };
  }, [darkMode]);

  /* --------------------------------
     UPDATE CLOCK
  -------------------------------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* --------------------------------
     CURRENT NODE
  -------------------------------- */

  const node =
    nodes.find(
      (item) => item.id === selectedNode
    ) ?? null;

  const currentHistory =
    history[selectedNode];

  const updatedTime =
    lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  /* --------------------------------
     NODE SELECTOR
  -------------------------------- */

  const selectNode = (id: NodeId) => {
    setSelectedNode(id);

    setShowHistory(false);

    setLastUpdated(new Date());
  };

  /* --------------------------------
     THEME
  -------------------------------- */

  const toggleTheme = () => {
    setDarkMode(
      (current) => !current
    );
  };

  /* --------------------------------
     HISTORY / CURRENT TOGGLE
  -------------------------------- */

  const toggleHistory = () => {
    setShowHistory(
      (current) => !current
    );
  };

  /* --------------------------------
     LOADING
  -------------------------------- */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
          }}
        >
          Connecting to Firebase...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard">

        {/* =====================================
            SIDEBAR
        ===================================== */}

        <aside className="sidebar">

          {/* WELCOME */}

          <section className="welcome-card">
            <div className="welcome-decoration" />

            <h1 className="welcome-title">
              WELCOME!
            </h1>

            <p className="welcome-text">
              Air quality monitoring and
              environmental sensor information.
            </p>
          </section>

          {/* AIR QUALITY */}

          <section className="sidebar-card">

            <div className="sidebar-header">
              <span className="sidebar-header-text">
                AIR QUALITY
              </span>
            </div>

            <div className="sidebar-body">

              {node ? (
                <>
                  <div className="large-value">
                    {node.airQuality}
                  </div>

                  <p className="small-description">
                    Current air quality condition
                    at {node.location}.
                  </p>

                  <span
                    className={`status-badge ${
                      node.status === "Normal"
                        ? "status-normal"
                        : "status-warning"
                    }`}
                  >
                    {node.status}
                  </span>
                </>
              ) : (
                <div className="large-value">
                  No Data
                </div>
              )}

            </div>
          </section>

          {/* MAIN SYSTEM STATUS */}

          <section className="sidebar-card">

            <div className="sidebar-header">
              <span className="sidebar-header-text">
                MAIN SYSTEM STATUS
              </span>
            </div>

            <div className="sidebar-body">

              <div className="large-value">
                {firebaseError
                  ? "Offline"
                  : "Online"}
              </div>

              <p className="small-description">
                Environmental sensors are
                currently connected to the
                monitoring system.
              </p>

              <span
                className={`status-badge ${
                  firebaseError
                    ? "status-warning"
                    : "status-normal"
                }`}
              >
                {firebaseError
                  ? "Connection Error"
                  : "System Normal"}
              </span>

            </div>
          </section>

          {/* PARTICULATE MATTER */}

          <section className="sidebar-card">

            <div className="sidebar-header">
              <span className="sidebar-header-text">
                PARTICULATE MATTER
              </span>
            </div>

            <div className="sidebar-body">

              <div className="large-value">
                {node
                  ? node.particulateMatter
                  : "--"}

                <span className="unit">
                  {" "}µg/m³
                </span>
              </div>

              <p className="small-description">
                Current particulate concentration
              </p>

            </div>
          </section>

        </aside>

        {/* =====================================
            MAIN CONTENT
        ===================================== */}

        <main className="main-content">

          {/* TITLE */}

          <section className="title-card">

            <div className="title-content">

              <div className="title-orb" />

              <h1 className="dashboard-title">
                Air Quality Monitoring Dashboard
              </h1>

              <p className="title-subtitle">
                Real-time environmental sensor
                monitoring and air quality
                information.
              </p>

            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
            >
              <span className="theme-icon">
                {darkMode ? "☀" : "☾"}
              </span>

              <span>
                {darkMode
                  ? "Light"
                  : "Dark"}
              </span>
            </button>

          </section>

          {/* FIREBASE ERROR */}

          {firebaseError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "12px",
                background:
                  "rgba(255, 90, 90, 0.12)",
                color:
                  "var(--text-color, #222)",
                fontSize: "14px",
              }}
            >
              {firebaseError}
            </div>
          )}

          {/* =====================================
              NODE SELECTOR
          ===================================== */}

          <section className="node-selector">

            <div className="section-label">
              MONITORING NODE
            </div>

            <div className="node-buttons">

              {(
                ["NODE 1", "NODE 2"] as NodeId[]
              ).map((id) => (

                <button
                  key={id}
                  type="button"
                  className={`node-button ${
                    selectedNode === id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectNode(id)
                  }
                >
                  <span className="node-button-text">
                    {id}
                  </span>
                </button>

              ))}

            </div>

          </section>

          {/* =====================================
              ENVIRONMENTAL SENSOR DATA
          ===================================== */}

          <section className="environment-section">

            <div className="section-header">

              <div>

                <h2 className="section-title">
                  Environmental Sensor Data
                </h2>

                <p className="selected-node-text">
                  Monitoring:{" "}
                  {node
                    ? node.location
                    : "No data"}
                </p>

              </div>

              <div className="updated-container">

                <span className="live-dot" />

                <span className="selected-node-text">
                  Updated {updatedTime}
                </span>

              </div>

            </div>

            <div className="sensor-grid">

              {/* TEMPERATURE */}

              <article className="sensor-card sensor-temperature">

                <div className="sensor-icon">
                  🌡
                </div>

                <p className="sensor-title">
                  TEMPERATURE
                </p>

                <div className="sensor-value">
                  {node
                    ? `${node.temperature}°C`
                    : "--"}
                </div>

                <p className="sensor-description">
                  Current environmental
                  temperature
                </p>

                <span className="sensor-status">
                  Stable
                </span>

              </article>

              {/* HUMIDITY */}

              <article className="sensor-card sensor-humidity">

                <div className="sensor-icon">
                  💧
                </div>

                <p className="sensor-title">
                  HUMIDITY
                </p>

                <div className="sensor-value">
                  {node
                    ? `${node.humidity}%`
                    : "--"}
                </div>

                <p className="sensor-description">
                  Relative humidity level
                </p>

                <span className="sensor-status good">
                  Normal
                </span>

              </article>

              {/* PRESSURE */}

              <article className="sensor-card sensor-pressure">

                <div className="sensor-icon">
                  ◉
                </div>

                <p className="sensor-title">
                  PRESSURE
                </p>

                <div className="sensor-value">
                  {node
                    ? node.pressure
                    : "--"}
                </div>

                <p className="sensor-description">
                  Atmospheric pressure in hPa
                </p>

                <span className="sensor-status">
                  Stable
                </span>

              </article>

              {/* AIR QUALITY */}

              <article className="sensor-card sensor-air">

                <div className="sensor-icon">
                  ✦
                </div>

                <p className="sensor-title">
                  AIR QUALITY
                </p>

                <div className="sensor-value">
                  {node
                    ? node.airQuality
                    : "--"}
                </div>

                <p className="sensor-description">
                  Current air quality
                  classification
                </p>

                <span
                  className={`sensor-status ${
                    node?.airQuality === "Good"
                      ? "good"
                      : "moderate"
                  }`}
                >
                  {node
                    ? node.status
                    : "--"}
                </span>

              </article>

            </div>

          </section>

          {/* =====================================
              TRENDS
          ===================================== */}

          <section className="trends-card">

            <div className="trends-header">

              <div>

                <h2 className="trends-title">
                  Trends
                </h2>

                <p className="trends-subtitle">
                  {showHistory
                    ? `Historical environmental readings for ${selectedNode}.`
                    : `Particulate matter readings for ${selectedNode}.`}
                </p>

              </div>

              {/* HISTORY / CURRENT BUTTON */}

              <button
                type="button"
                className={`tab ${
                  showHistory
                    ? "active"
                    : ""
                }`}
                onClick={toggleHistory}
              >
                <span className="tab-text">
                  {showHistory
                    ? "CURRENT"
                    : "HISTORY"}
                </span>
              </button>

            </div>

            {/* =====================================
                CURRENT VIEW
                GRAPH APPEARS HERE
            ===================================== */}

            {!showHistory && (

              <div className="trend-graph-container">

                <div className="trend-graph-header">

                  <div>

                    <span className="trend-graph-label">
                    
                    </span>

                    
                  </div>

                  <div
                    className={`trend-quality ${
                      node?.airQuality === "Good"
                        ? "good"
                        : "moderate"
                    }`}
                  >
                    {node
                      ? node.airQuality
                      : "--"}
                  </div>

                </div>

                {/* GRAPH */}

                {currentHistory
                  .particulateMatter
                  .length > 0 ? (

                  <div className="trend-chart-wrapper">

                    <svg
                      viewBox="0 0 800 300"
                      preserveAspectRatio="none"
                      className="trend-line-chart"
                    >

                      {/* GRID */}

                      <line
                        x1="55"
                        y1="40"
                        x2="770"
                        y2="40"
                        className="chart-grid-line"
                      />

                      <line
                        x1="55"
                        y1="95"
                        x2="770"
                        y2="95"
                        className="chart-grid-line"
                      />

                      <line
                        x1="55"
                        y1="150"
                        x2="770"
                        y2="150"
                        className="chart-grid-line"
                      />

                      <line
                        x1="55"
                        y1="205"
                        x2="770"
                        y2="205"
                        className="chart-grid-line"
                      />

                      <line
                        x1="55"
                        y1="260"
                        x2="770"
                        y2="260"
                        className="chart-grid-line"
                      />

                      {/* Y AXIS */}

                      <text
                        x="15"
                        y="45"
                        className="chart-axis-label"
                      >
                        40
                      </text>

                      <text
                        x="15"
                        y="100"
                        className="chart-axis-label"
                      >
                        30
                      </text>

                      <text
                        x="15"
                        y="155"
                        className="chart-axis-label"
                      >
                        20
                      </text>

                      <text
                        x="15"
                        y="210"
                        className="chart-axis-label"
                      >
                        10
                      </text>

                      <text
                        x="20"
                        y="265"
                        className="chart-axis-label"
                      >
                        0
                      </text>

                      {/* LINE */}

                      <polyline
                        points={currentHistory
                          .particulateMatter
                          .map(
                            (
                              value,
                              index,
                              array
                            ) => {

                              const x =
                                55 +
                                (index /
                                  Math.max(
                                    array.length -
                                      1,
                                    1
                                  )) *
                                  715;

                              const maxValue =
                                40;

                              const safeValue =
                                Math.min(
                                  Math.max(
                                    value,
                                    0
                                  ),
                                  maxValue
                                );

                              const y =
                                260 -
                                (safeValue /
                                  maxValue) *
                                  220;

                              return `${x},${y}`;
                            }
                          )
                          .join(" ")}
                        className="trend-polyline"
                      />

                      {/* DATA POINTS */}

                      {currentHistory
                        .particulateMatter
                        .map(
                          (
                            value,
                            index,
                            array
                          ) => {

                            const x =
                              55 +
                              (index /
                                Math.max(
                                  array.length -
                                    1,
                                  1
                                )) *
                                715;

                            const maxValue =
                              40;

                            const safeValue =
                              Math.min(
                                Math.max(
                                  value,
                                  0
                                ),
                                maxValue
                              );

                            const y =
                              260 -
                              (safeValue /
                                maxValue) *
                                220;

                            return (
                              <circle
                                key={`pm-point-${index}`}
                                cx={x}
                                cy={y}
                                r="6"
                                className="trend-point"
                              />
                            );
                          }
                        )}

                      {/* X AXIS */}

                      {currentHistory
                        .particulateMatter
                        .map(
                          (
                            _,
                            index,
                            array
                          ) => {

                            const x =
                              55 +
                              (index /
                                Math.max(
                                  array.length -
                                    1,
                                  1
                                )) *
                                715;

                            return (
                              <text
                                key={`pm-label-${index}`}
                                x={x}
                                y="290"
                                textAnchor="middle"
                                className="chart-axis-label"
                              >
                                {index + 1}
                              </text>
                            );
                          }
                        )}

                    </svg>

                  </div>

                ) : (

                  <div className="no-chart-data">
                    Waiting for sensor readings...
                  </div>

                )}

              </div>

            )}

            {/* =====================================
                HISTORY VIEW
                GRAPH IS HIDDEN HERE
            ===================================== */}

            {showHistory && (

              <div className="history-container">

                <div className="history-grid">

                  {/* TEMPERATURE HISTORY */}

                  <div className="history-card">

                    <div className="history-card-title">
                      Temperature
                    </div>

                    {currentHistory
                      .temperature
                      .length > 0 ? (

                      currentHistory.temperature.map(
                        (value, index) => (

                          <div
                            className="history-row"
                            key={`temperature-${index}`}
                          >

                            <span className="history-node">
                              Reading {index + 1}
                            </span>

                            <span className="history-value">
                              {value}°C
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="history-row">

                        <span className="history-node">
                          No readings yet
                        </span>

                      </div>

                    )}

                    <p className="history-description">
                      Historical temperature
                      readings.
                    </p>

                  </div>

                  {/* HUMIDITY HISTORY */}

                  <div className="history-card">

                    <div className="history-card-title">
                      Humidity
                    </div>

                    {currentHistory
                      .humidity
                      .length > 0 ? (

                      currentHistory.humidity.map(
                        (value, index) => (

                          <div
                            className="history-row"
                            key={`humidity-${index}`}
                          >

                            <span className="history-node">
                              Reading {index + 1}
                            </span>

                            <span className="history-value">
                              {value}%
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="history-row">

                        <span className="history-node">
                          No readings yet
                        </span>

                      </div>

                    )}

                    <p className="history-description">
                      Historical humidity
                      readings.
                    </p>

                  </div>

                  {/* PRESSURE HISTORY */}

                  <div className="history-card">

                    <div className="history-card-title">
                      Pressure
                    </div>

                    {currentHistory
                      .pressure
                      .length > 0 ? (

                      currentHistory.pressure.map(
                        (value, index) => (

                          <div
                            className="history-row"
                            key={`pressure-${index}`}
                          >

                            <span className="history-node">
                              Reading {index + 1}
                            </span>

                            <span className="history-value">
                              {value} hPa
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="history-row">

                        <span className="history-node">
                          No readings yet
                        </span>

                      </div>

                    )}

                    <p className="history-description">
                      Historical pressure
                      readings.
                    </p>

                  </div>

                  {/* PARTICULATE MATTER HISTORY */}

                  <div className="history-card">

                    <div className="history-card-title">
                      Particulate Matter
                    </div>

                    {currentHistory
                      .particulateMatter
                      .length > 0 ? (

                      currentHistory.particulateMatter.map(
                        (value, index) => (

                          <div
                            className="history-row"
                            key={`pm-${index}`}
                          >

                            <span className="history-node">
                              Reading {index + 1}
                            </span>

                            <span className="history-value">
                              {value} µg/m³
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="history-row">

                        <span className="history-node">
                          No readings yet
                        </span>

                      </div>

                    )}

                    <p className="history-description">
                      Historical particulate
                      matter readings.
                    </p>

                  </div>

                </div>

              </div>

            )}

          </section>

        </main>

      </div>
    </div>
  );
}