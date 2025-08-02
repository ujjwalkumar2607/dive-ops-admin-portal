import React, { useState, useEffect } from 'react';
import {
  getCrew,
  createCrew,
  updateCrew,
  deleteCrew
} from '../services/crewService';

const initialForm = {
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  telephone: '',
  contactMethod: 'email',
  dateEmploymentStarted: '',
  currentCycleStart: '',
  cycleLengthWeeks: '1',
  currentCycleEnd: '',
  positionsTrainedCaptain: false,
  positionsTrained1stMate:  false,
  positionsTrainedEngineer: false,
  positionsTrainedChef:     false,
  positionsTrainedDeckhand: false,
  boatsTrainedCatPpalu:     false,
  boatsTrainedMorningStar:  false,
  boatsTrainedSeaExplorer:  false,
  bankName: '',
  instituteNumber: '',
  transitNumber: '',
  accountNumber: ''
};

export default function CrewDetail() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch all crew
  const fetchCrew = async () => {
    try {
      setList(await getCrew());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };
  useEffect(() => {
    fetchCrew();
  }, []);

  // Auto‑compute cycle end date
  useEffect(() => {
    if (form.currentCycleStart && form.cycleLengthWeeks) {
      const d = new Date(form.currentCycleStart);
      d.setDate(d.getDate() + Number(form.cycleLengthWeeks) * 7);
      setForm(f => ({
        ...f,
        currentCycleEnd: d.toISOString().slice(0, 10)
      }));
    } else {
      setForm(f => ({ ...f, currentCycleEnd: '' }));
    }
  }, [form.currentCycleStart, form.cycleLengthWeeks]);

  // Create or update
  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        positionsTrainedCaptain: form.positionsTrainedCaptain,
        positionsTrained1stMate: form.positionsTrained1stMate,
        positionsTrainedEngineer: form.positionsTrainedEngineer,
        positionsTrainedChef: form.positionsTrainedChef,
        positionsTrainedDeckhand: form.positionsTrainedDeckhand,
        boatsTrainedCatPpalu: form.boatsTrainedCatPpalu,
        boatsTrainedMorningStar: form.boatsTrainedMorningStar,
        boatsTrainedSeaExplorer: form.boatsTrainedSeaExplorer,
        preferredName: form.preferredName,
        bankName: form.bankName,
        instituteNumber: form.instituteNumber,
        transitNumber: form.transitNumber,
        accountNumber: form.accountNumber,
      };

      if (form._id) {
        await updateCrew({ ...payload, _id: form._id });
      } else {
        await createCrew(payload);
      }

      await fetchCrew();
      setForm(initialForm);
      setShowForm(false);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Edit existing
  const handleEdit = c => {
    setForm({
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      preferredName:    c.preferredName    || '',
      email: c.email,
      telephone: c.telephone,
      contactMethod: c.contactMethod,
      dateEmploymentStarted: c.dateEmploymentStarted.slice(0, 10),
      currentCycleStart: c.currentCycleStart.slice(0, 10),
      cycleLengthWeeks: String(c.cycleLengthWeeks),
      currentCycleEnd: c.currentCycleEnd,
      positionsTrainedCaptain:    c.positionsTrainedCaptain,
      positionsTrained1stMate:     c.positionsTrained1stMate,
      positionsTrainedEngineer:    c.positionsTrainedEngineer,
      positionsTrainedChef:        c.positionsTrainedChef,
      positionsTrainedDeckhand:    c.positionsTrainedDeckhand,
      boatsTrainedCatPpalu:        c.boatsTrainedCatPpalu,
      boatsTrainedMorningStar:     c.boatsTrainedMorningStar,
      boatsTrainedSeaExplorer:     c.boatsTrainedSeaExplorer,
      bankName:         c.bankName         || '',
      instituteNumber: c.instituteNumber || '',
      transitNumber:   c.transitNumber   || '',
      accountNumber:   c.accountNumber   || ''
    });
    setShowForm(true);
  };

  // Delete
  const handleDelete = async id => {
    try {
      await deleteCrew(id);
      setList(list.filter(c => c._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="mb-4 text-lg font-medium">
        Total Crew Members: {list.length}
      </div>
      {/* Toggles */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setShowForm((f) => !f)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {showForm ? "Hide Form" : form._id ? "Edit Crew" : "Add Crew"}
        </button>
        <button
          onClick={() => {
            setExpandedId(null);
            setShowList((l) => !l);
          }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {showList ? "Hide Crew Members" : "Show Crew Members"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-gray-200 p-6 rounded mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            {form._id ? "Update Crew" : "New Crew"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Preferred Name
              </label>
              <input
                type="text"
                value={form.preferredName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preferredName: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Telephone */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Telephone *
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telephone: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Preferred Contact */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Preferred Contact
              </label>
              <select
                value={form.contactMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactMethod: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            {/* Date Employed */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Date Employed *
              </label>
              <input
                type="date"
                value={form.dateEmploymentStarted}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dateEmploymentStarted: e.target.value,
                  }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Cycle Start */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Cycle Start (ONLY SELECT A SATURDAY!)*
              </label>
              <input
                type="date"
                value={form.currentCycleStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentCycleStart: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Cycle Length */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Cycle Length (weeks)
              </label>
              <input
                type="number"
                min="1"
                value={form.cycleLengthWeeks}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cycleLengthWeeks: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>

            {/* Current Cycle End */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Current Cycle End
              </label>
              <input
                type="date"
                value={form.currentCycleEnd}
                disabled
                className="mt-1 border bg-gray-100 rounded px-3 py-2"
              />
            </div>

            {/* Positions Trained */}
            <h3 className="col-span-1 md:col-span-2 mt-4 text-lg font-semibold">
              Positions Trained
            </h3>
            {[
              ["Captain", "positionsTrainedCaptain"],
              ["1st Mate", "positionsTrained1stMate"],
              ["Engineer", "positionsTrainedEngineer"],
              ["Chef", "positionsTrainedChef"],
              ["Deckhand/Divemaster", "positionsTrainedDeckhand"],
            ].map(([label, key]) => (
              <div key={key} className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <select
                  value={form[key] ? "true" : "false"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value === "true" }))
                  }
                  className="mt-1 border rounded px-3 py-2 focus:ring"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            ))}

            {/* Boats Trained */}
            <h3 className="col-span-1 md:col-span-2 mt-4 text-lg font-semibold">
              Boats Trained
            </h3>
            {[
              ["Cat Ppalu", "boatsTrainedCatPpalu"],
              ["Morning Star", "boatsTrainedMorningStar"],
              ["Sea Explorer", "boatsTrainedSeaExplorer"],
            ].map(([label, key]) => (
              <div key={key} className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <select
                  value={form[key] ? "true" : "false"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value === "true" }))
                  }
                  className="mt-1 border rounded px-3 py-2 focus:ring"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            ))}
          </div>
          <h3 className="col-span-1 md:col-span-2 mt-6 text-lg font-semibold">
            Bank Details
          </h3>

          {[
            ["Bank Name", "bankName"],
            ["Institution No.", "instituteNumber"],
            ["Transit No.", "transitNumber"],
            ["Account No.", "accountNumber"],
          ].map(([label, key]) => (
            <div key={key} className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1 border rounded px-3 py-2 focus:ring"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="mt-6 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            {form._id ? "Update" : "Add"} Crew
          </button>
        </div>
      )}

      {/* Crew Members List */}
      {/* {showForm && (
        <div className="border border-gray-200 p-6 rounded mb-6">
         
          <button
            onClick={handleSave}
            className="mt-6 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            Save
          </button>
        </div>
      )} */}

      {/* crew list / details */}
      {showList && (
        <div>
          {!expandedId ? (
            // list of names
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c._id}>
                  <button
                    onClick={() => setExpandedId(c._id)}
                    className="text-left w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded"
                  >
                    {c.firstName} {c.lastName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // expanded details
            (() => {
              const c = list.find((x) => x._id === expandedId);
              if (!c) return null;
              return (
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-semibold">
                      {c.firstName} {c.lastName}
                    </h3>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Hide Details
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Preferred Name:</span>{" "}
                      {c.preferredName || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {c.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {c.telephone}
                    </div>
                    <div>
                      <span className="font-medium">Contact Method:</span>{" "}
                      {c.contactMethod}
                    </div>
                    <div>
                      <span className="font-medium">Employed:</span>{" "}
                      {c.dateEmploymentStarted.split("T")[0]}
                    </div>
                    <div>
                      <span className="font-medium">Cycle Start:</span>{" "}
                      {c.currentCycleStart.split("T")[0]}
                    </div>
                    <div>
                      <span className="font-medium">Cycle Length:</span>{" "}
                      {c.cycleLengthWeeks} weeks
                    </div>
                    <div>
                      <span className="font-medium">Cycle End:</span>{" "}
                      {c.currentCycleEnd.split("T")[0]}
                    </div>
                  </div>

                  {/* positions trained */}
                  <div>
                    <h4 className="font-medium">Positions Trained</h4>
                    <ul className="list-disc pl-6 text-sm">
                      {[
                        ["Captain", "positionsTrainedCaptain"],
                        ["1st Mate", "positionsTrained1stMate"],
                        ["Engineer", "positionsTrainedEngineer"],
                        ["Chef", "positionsTrainedChef"],
                        ["Deckhand/Divemaster", "positionsTrainedDeckhand"],
                      ].map(([label, key]) => (
                        <li key={key}>
                          {label}: {c[key] === true ? "Yes" : "No"}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* boats trained */}
                  <div>
                    <h4 className="font-medium">Boats Trained</h4>
                    <ul className="list-disc pl-6 text-sm">
                      {[
                        ["Cat Ppalu", "boatsTrainedCatPpalu"],
                        ["Morning Star", "boatsTrainedMorningStar"],
                        ["Sea Explorer", "boatsTrainedSeaExplorer"],
                      ].map(([label, key]) => (
                        <li key={key}>
                          {label}: {c[key] === true ? "Yes" : "No"}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-700">
                    Bank Details:
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>Bank Name: {c.bankName || "—"}</li>
                    <li>Institution #: {c.instituteNumber || "—"}</li>
                    <li>Transit #: {c.transitNumber || "—"}</li>
                    <li>Account #: {c.accountNumber || "—"}</li>
                  </ul>

                  {/* edit/delete */}
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        handleEdit(c);
                        setExpandedId(null);
                      }}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
