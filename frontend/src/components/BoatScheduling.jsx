// src/components/BoatScheduling.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import {
  format,
  eachWeekOfInterval,
  startOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { getSchedule, saveSchedule } from "../services/scheduleService";
import { updateCrew, getCrew } from "../services/crewService";
import "react-datepicker/dist/react-datepicker.css";
import { differenceInCalendarWeeks, parseISO } from "date-fns";
// src/components/BoatScheduling.jsx
import { useAuth } from "../services/useAuth";

export default function BoatScheduling() {
  const [tripDate, setTripDate] = useState(new Date());
  const earliestSat = startOfWeek(new Date(), { weekStartsOn: 6 });;
  const [slots, setSlots] = useState({});
  const [crewList, setCrewList] = useState([]);
  const [editing, setEditing] = useState(false);
  const [printRange, setPrintRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 6 }),
    end: addWeeks(startOfWeek(new Date(), { weekStartsOn: 6 }), 4),
  });

  const { role } = useAuth();

  const boats = [
    {
      id: "catPpalu",
      name: "Cat Ppalu",
      positions: [
        "CAPT",
        "1st MATE",
        "ENGINEER",
        "CHEF",
        "DIVEMASTER",
        "EXTRA",
      ],
    },
    {
      id: "morningStar",
      name: "Morning Star",
      positions: [
        "CAPT",
        "1st MATE",
        "ENGINEER",
        "CHEF",
        "DIVEMASTER",
        "EXTRA",
      ],
    },
    {
      id: "seaExplorer",
      name: "Sea Explorer",
      positions: [
        "CAPT",
        "1st MATE",
        "ENGINEER",
        "CHEF",
        "DIVEMASTER",
        "EXTRA",
      ],
    },
  ];

  const positionKeyMap = {
    CAPT:        'positionsTrainedCaptain',
    '1st MATE':  'positionsTrained1stMate',
    ENGINEER:    'positionsTrainedEngineer',
    CHEF:        'positionsTrainedChef',
    DIVEMASTER:  'positionsTrainedDeckhand',
    EXTRA:       null, // everyone is "trained" for Extra
  };
  
  // maps your boat.id → the crew boolean prop
  const boatKeyMap = {
    catPpalu:     'boatsTrainedCatPpalu',
    morningStar:  'boatsTrainedMorningStar',
    seaExplorer:  'boatsTrainedSeaExplorer',
  };

  const thisSat = startOfWeek(tripDate, { weekStartsOn: 6 });
  const prevSat = subWeeks(thisSat, 1);
  const nextSat = addWeeks(thisSat, 1);

  useEffect(() => {
    getCrew().then(setCrewList).catch(console.error);
  }, []);

  useEffect(() => {
    [prevSat, thisSat, nextSat].forEach((d) => {
      const ds = d.toISOString().slice(0, 10);
      getSchedule(ds)
        .then((data) => setSlots((s) => ({ ...s, [ds]: data })))
        .catch(console.error);
    });
  }, [tripDate]);

  // Helper function to calculate the first eligible Saturday for a crew member
  const getFirstEligibleSaturday = (cycleStartDate) => {
    const startDate = typeof cycleStartDate === 'string' ? parseISO(cycleStartDate) : cycleStartDate;
    const startDay = startDate.getDay(); // 0=Sun, 6=Sat
    
    if (startDay === 6) {
      // If started on Saturday, that's the first eligible Saturday
      return startDate;
    } else {
      // If started on another day, first eligible Saturday is the next Saturday
      const daysUntilSaturday = (6 - startDay + 7) % 7;
      const firstSaturday = new Date(startDate);
      firstSaturday.setDate(startDate.getDate() + daysUntilSaturday);
      return firstSaturday;
    }
  };

  const handleSelect = async (boatId, position, weekStart, crewId) => {
    // find the crew record
    const crew = crewList.find((c) => String(c._id) === String(crewId));

    let finalWeek = 0;
    let finalCycleLength = 0;

    if (crewId && crew) {
      // Get the first eligible Saturday for this crew member
      const firstEligibleSat = getFirstEligibleSaturday(crew.currentCycleStart);
      const weekStartDate = parseISO(weekStart);
      
      // Calculate weeks from the first eligible Saturday
      const wk = differenceInCalendarWeeks(weekStartDate, firstEligibleSat, {
        weekStartsOn: 6,
      }) + 1;

      const maxCycle = crew.cycleLengthWeeks;

      // Check if they were scheduled last week on any boat
      const prev = new Date(weekStart);
      prev.setDate(prev.getDate() - 7);
      const prevKey = prev.toISOString().slice(0,10);
      const scheduledLastWeek = Object.values(slots[prevKey] || {})
        .flatMap(b => Object.values(b))
        .some(s => String(s.crewId) === String(crewId));
      
      if (wk > maxCycle && !scheduledLastWeek) {
        // --- MISSED one week after finishing cycle ⇒ auto reset ---
        // 1) Persist new cycle start
        await updateCrew({ ...crew, currentCycleStart: weekStart });
        // 2) Refresh your local crewList so future clicks use updated start
        const refreshed = await getCrew();
        setCrewList(refreshed);

        finalWeek = 1;
        finalCycleLength = maxCycle;
      }
      else if (wk > maxCycle) {
        window.alert(
          `⚠️ ${crew.firstName} ${crew.lastName} is over their cycle limit!\n` +
          `Week: ${wk}, Cycle length: ${maxCycle}`
        );
        const doReset = window.confirm(
          `Reset ${crew.firstName}'s cycle to start on ${weekStart}?`
        );
        if (doReset) {
          await updateCrew({ ...crew, currentCycleStart: weekStart });
          const refreshed = await getCrew();
          setCrewList(refreshed);
          finalWeek = 1;
          finalCycleLength = maxCycle;
        } else {
          finalWeek = wk;
          finalCycleLength = maxCycle;
        }
      } else {
        finalWeek = wk;
        finalCycleLength = maxCycle;
      }
    }

    setSlots(prev => {
      const weeks = { ...prev };
      weeks[weekStart]         = { ...(weeks[weekStart] || {}) };
      weeks[weekStart][boatId] = { ...(weeks[weekStart][boatId] || {}) };

      if (!crewId) {
        delete weeks[weekStart][boatId][position];
      } else {
        const displayName = crew.preferredName?.trim()
          ? crew.preferredName
          : `${crew.firstName} ${crew.lastName}`;

        weeks[weekStart][boatId][position] = {
          crewId,
          name:        displayName,
          week:        finalWeek,
          cycleLength: finalCycleLength,
          cycleCount:  `${finalWeek}/${finalCycleLength}`
        };
      }

      return weeks;
    });
  };

  const handleResetCycle = async (boatId, position, weekStart) => {
    const cell = slots[weekStart]?.[boatId]?.[position];
    if (!cell || !cell.crewId) return;

    // Find the crew member
    const crew = crewList.find((c) => String(c._id) === String(cell.crewId));
    if (!crew) return;

    // Update the crew member's cycle start date
    await updateCrew({ ...crew, currentCycleStart: weekStart });
    
    // Refresh crew list
    const refreshed = await getCrew();
    setCrewList(refreshed);

    // Update the slots
    setSlots((prev) => {
      const weeks = { ...prev };
      const updatedCell = { ...weeks[weekStart][boatId][position] };
      updatedCell.week = 1;
      updatedCell.cycleCount = `1/${updatedCell.cycleLength}`;
      updatedCell.overByOne = false;
      weeks[weekStart][boatId][position] = updatedCell;
      return weeks;
    });
  };

  const saveAll = () => {
    Object.entries(slots).forEach(([date, sl]) =>
      saveSchedule(date, sl).catch(console.error)
    );
    alert("Saved!");
  };

  const panels = [
    { label: "Previous", date: prevSat },
    { label: "Current", date: thisSat },
    { label: "Next", date: nextSat },
  ];

  async function generatePDF() {
    // 1) determine range
    const { start, end } = printRange;
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 6 });

    // 2) fetch all week slots
    const allSlots = {};
    await Promise.all(
      weeks.map((wk) => {
        const dstr = wk.toISOString().slice(0, 10);
        return getSchedule(dstr).then((data) => {
          allSlots[dstr] = data;
        });
      })
    );

    // 3) build flat rows for the table
    const rows = [];
    weeks.forEach((wk) => {
      const dstr = wk.toISOString().slice(0, 10);
      const slotsForWeek = allSlots[dstr] || {};
      Object.entries(slotsForWeek).forEach(([boatId, posMap]) => {
        Object.entries(posMap).forEach(([pos, slot]) => {
          rows.push({
            weekStart: dstr,
            boat: boatId.replace(/([A-Z])/g, " $1").trim(), // e.g. "morningStar"→"morning Star"
            position: pos,
            crew: slot.name,
            cycle: `${slot.week}/${slot.cycleLength}`,
          });
        });
      });
    });

    // 4) create PDF and AutoTable
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "letter",
    });

    // optional title
    doc.setFontSize(14);
    doc.text(
      `Schedule ${format(start, "d MMMM yyyy")} to ${format(end, "d MMMM yyyy")}`,
      40,
      40
    );

    // table columns
    const columns = [
      { header: "Week Start", dataKey: "weekStart" },
      { header: "Boat", dataKey: "boat" },
      { header: "Position", dataKey: "position" },
      { header: "Crew", dataKey: "crew" },
      { header: "Cycle", dataKey: "cycle" },
    ];

    autoTable(doc, {
      startY: 60,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: 40, right: 40 },
      columns,
      body: rows,
    });

    // 5) save
    doc.save(
      `schedule_${format(start, "yyyyMMdd")}_${format(end, "yyyyMMdd")}.pdf`
    );
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 space-y-6 flex flex-col items-center">
      

      {/* Date picker & Save */}
      <div className="flex items-center justify-center space-x-4 w-full">
        <label className="block text-m font-medium">Viewing Week Of :</label>
        <DatePicker
          selected={tripDate}
          onChange={setTripDate}
          className="border rounded px-3 py-2 w-44"
        />
        {editing && (
          <button
            onClick={() => { saveAll(); setEditing(false); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save Schedule
          </button>
        )}
      </div>
      {/* — New: Print Range Pickers — */}
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <DatePicker
            selected={printRange.start}
            onChange={(d) =>
              setPrintRange((r) => ({
                ...r,
                start: startOfWeek(d, { weekStartsOn: 6 }),
              }))
            }
            className="mt-1 border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <DatePicker
            selected={printRange.end}
            onChange={(d) =>
              setPrintRange((r) => ({
                ...r,
                end: startOfWeek(d, { weekStartsOn: 6 }),
              }))
            }
            className="mt-1 border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={generatePDF}
          className="mt-6 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow"
        >
          Print Schedule
        </button>
      </div>

      {/* Panels + Arrows */}
      <div className="relative w-full">
        {/* Left arrow */}
        <button
          onClick={() => setTripDate((d) => subWeeks(d, 1))}
          className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 text-4xl text-gray-600 hover:text-gray-800 z-10"
        >
          ◀️
        </button>

        {/* Week panels */}
        <div className="flex justify-center space-x-6 overflow-auto w-full px-12">
          {panels.map(({ label, date }) => {
            const ds = date.toISOString().slice(0, 10);
            const takenIds = Object.values(slots[ds] || {})
              .flatMap((boatMap) => Object.values(boatMap))
              .map((slot) => slot.crewId)
              .filter(Boolean);
              const thisSat = startOfWeek(earliestSat, { weekStartsOn: 6 });
              const isPast  = date.getTime() < thisSat.getTime();
            return (
              <div
                key={ds}
                className="flex-shrink-0 w-96 bg-gray-100 p-4 rounded shadow"
              >
                {role === 'manager' && !isPast && (
                <button
                  onClick={() => setEditing((e) => !e)}
                  className="absolute top-1 right-8 px-4 py-2 bg-blue-600  text-white rounded hover:bg-blue-500 text-m"
                >
                  {editing ? "Cancel" : "Edit Schedule"}
                </button>
                )}

                <h3 className="font-semibold mb-1">{label} Week</h3>
                <div className="text-sm text-gray-700 mb-4">
                  {format(date, "dd-MMM-yyyy")}
                </div>
                {boats.map((boat) => (
                  <div key={boat.id} className="mb-6 bg-white rounded">
                    <div className="bg-blue-200 text-blue-800 px-2 py-1 font-medium">
                      {boat.name}
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 text-sm">
                      <div className="font-semibold">POS</div>
                      <div className="font-semibold">CREW</div>
                      <div className="font-semibold">CYCLE</div>
                      {boat.positions.map((pos) => {
                        const cell = slots[ds]?.[boat.id]?.[pos] || {};

                        const week = cell.week || 0;
                        const cycle = cell.cycleLength || 0;
                        const isOver =
                          cell.cycleLength > 0 && cell.week > cell.cycleLength;
                        const cycleText = cell.cycleCount || "";

                        return (
                          <React.Fragment key={pos}>
                            {/* POSITION */}
                            <div>{pos}</div>

                            {/* CREW: if assigned, show clickable name; otherwise show dropdown */}
                            <div>
                              {cell.crewId ? (
                                <button
                                  disabled={!editing || isPast}
                                  onClick={() => {
                                    // bail out if not editing or in a past week
                                    if (!editing || isPast) return;

                                    if (isOver) {
                                      const ok = window.confirm(
                                        `⚠️ ${cell.name} is over their cycle.\n\n` +
                                          `Current: ${cell.week}/${cell.cycleLength}\n\n` +
                                          `Reset their cycle to start here?`
                                      );
                                      if (ok)
                                        handleResetCycle(boat.id, pos, ds);
                                    } else {
                                      handleSelect(boat.id, pos, ds, "");
                                    }
                                  }}
                                  className={
                                    !editing || isPast
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-blue-600 underline hover:text-blue-800"
                                  }
                                >
                                  {cell.name}
                                </button>
                              ) : (
                                <select
                                  value={cell.crewId || ""}
                                  onChange={(e) => {
                                    if (!editing || isPast) return;
                                    handleSelect(
                                      boat.id,
                                      pos,
                                      ds,
                                      e.target.value
                                    );
                                  }}
                                  disabled={!editing || isPast}
                                  className="w-full border rounded px-1 py-0.5 disabled:opacity-50"
                                >
                                  <option value="">— select —</option>
                                  {crewList
                                    // 1️⃣ trained for this POSITION?
                                    .filter((c) => {
                                      const posKey = positionKeyMap[pos];
                                      return posKey ? c[posKey] : true;
                                    })
                                    // 2️⃣ trained for this BOAT?
                                    .filter((c) => {
                                      const boatKey = boatKeyMap[boat.id];
                                      return boatKey ? c[boatKey] : true;
                                    })
                                    // 3️⃣ joined by first eligible Saturday?
                                    .filter((c) => {
                                      const firstEligibleSat = getFirstEligibleSaturday(c.currentCycleStart);
                                      const weekDate = new Date(ds);
                                      
                                      // Check if the current week date is on or after the first eligible Saturday
                                      return weekDate >= firstEligibleSat;
                                    })
                                    // 4️⃣ not already assigned this week?
                                    .filter(
                                      (c) => !takenIds.includes(String(c._id))
                                    )
                                    // 5️⃣ render each remaining crew as an option
                                    .map((c) => {
                                      const label = c.preferredName?.trim()
                                        ? c.preferredName
                                        : `${c.firstName} ${c.lastName}`;
                                      return (
                                        <option key={c._id} value={c._id}>
                                          {label}
                                        </option>
                                      );
                                    })}
                                </select>
                              )}
                            </div>

                            {/* CYCLE DISPLAY */}
                            <div className={isOver ? "text-red-600" : ""}>
                              {cycleText}
                            </div>
                            {cell.overByOne && (
                              <button
                                onClick={() => {
                                  const ok = window.confirm(
                                    `⚠️ ${cell.name} is more than one week over their cycle.\n\n` +
                                      `Current: ${cell.week}/${cell.cycleLength}\n\n` +
                                      `Would you like to reset their cycle here?`
                                  );
                                  if (ok) handleResetCycle(boat.id, pos, ds);
                                }}
                                className="mt-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                              >
                                Reset Cycle
                              </button>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => setTripDate((d) => addWeeks(d, 1))}
          className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 text-4xl text-gray-600 hover:text-gray-800 z-10"
        >
          ▶️
        </button>
      </div>
    </div>
  );
}