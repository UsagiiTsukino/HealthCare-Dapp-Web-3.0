import React, { useState, useEffect } from "react";

export const AdminDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    address: "",
    phoneNumber: "",
    specialization: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const apiHost = "http://localhost:5000/api/auth";

  // Fetch doctors and pharmacists
  useEffect(() => {
    fetchDoctors();
    fetchPharmacists();
  }, []);

  const fetchDoctors = async () => {
    const response = await fetch(`${apiHost}/doctor/getalldoctors`);
    const data = await response.json();
    setDoctors(data);
  };

  const fetchPharmacists = async () => {
    const response = await fetch(`${apiHost}/pharmacist/getallpharmacists`);
    const data = await response.json();
    setPharmacists(data);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddDoctor = async () => {
    await fetch(`${apiHost}/doctor/createdoctor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    fetchDoctors();
    setFormData({
      name: "",
      email: "",
      password: "",
      dob: "",
      address: "",
      phoneNumber: "",
      specialization: "",
    });
  };

  const handleAddPharmacist = async () => {
    await fetch(`${apiHost}/pharmacist/createpharmacist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    fetchPharmacists();
    setFormData({
      name: "",
      email: "",
      password: "",
      dob: "",
      address: "",
      phoneNumber: "",
    });
  };

  const handleEdit = (item, type) => {
    setIsEditing(true);
    setEditId(item._id);
    setFormData(item);
  };

  const handleUpdate = async (type) => {
    const endpoint =
      type === "doctor"
        ? `${apiHost}/doctor/updatedoctor/${editId}`
        : `${apiHost}/pharmacist/updatepharmacist/${editId}`;

    await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (type === "doctor") {
      fetchDoctors();
    } else {
      fetchPharmacists();
    }

    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      dob: "",
      address: "",
      phoneNumber: "",
      specialization: "",
    });
  };

  const handleDelete = async (id, type) => {
    const endpoint =
      type === "doctor"
        ? `${apiHost}/doctor/deletedoctor/${id}`
        : `${apiHost}/pharmacist/deletepharmacist/${id}`;

    await fetch(endpoint, {
      method: "DELETE",
    });

    if (type === "doctor") {
      fetchDoctors();
    } else {
      fetchPharmacists();
    }
  };

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      {/* Form */}
      <div className="form-container">
        <h2>
          {isEditing ? "Edit" : "Add"} {editId ? "Doctor/Pharmacist" : ""}
        </h2>
        <form>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
          />
          <input
            type="date"
            name="dob"
            placeholder="Date of Birth"
            value={formData.dob}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
          />
          {editId && (
            <input
              type="text"
              name="specialization"
              placeholder="Specialization (Doctors only)"
              value={formData.specialization}
              onChange={handleInputChange}
            />
          )}
          <button
            type="button"
            onClick={
              isEditing
                ? () => handleUpdate(editId ? "doctor" : "pharmacist")
                : handleAddDoctor
            }
          >
            {isEditing ? "Update" : "Add Doctor"}
          </button>
          <button type="button" onClick={handleAddPharmacist}>
            Add Pharmacist
          </button>
        </form>
      </div>

      {/* Doctors Table */}
      <h2>Doctors</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Specialization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor._id}>
              <td>{doctor.name}</td>
              <td>{doctor.email}</td>
              <td>{doctor.specialization}</td>
              <td>
                <button onClick={() => handleEdit(doctor, "doctor")}>
                  Edit
                </button>
                <button onClick={() => handleDelete(doctor._id, "doctor")}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pharmacists Table */}
      <h2>Pharmacists</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pharmacists.map((pharmacist) => (
            <tr key={pharmacist._id}>
              <td>{pharmacist.name}</td>
              <td>{pharmacist.email}</td>
              <td>{pharmacist.phoneNumber}</td>
              <td>
                <button onClick={() => handleEdit(pharmacist, "pharmacist")}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pharmacist._id, "pharmacist")}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
