import React, { useState, useContext, useEffect, useRef } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import userContext from "../../context/users/userContext";
import Web3 from "web3";

export const BookAppointment = (props) => {
  const [details, setDetails] = useState({
    doctorId: "",
    doctorName: "",
    patientId: "",
    patientName: "",
    slotNo: "0",
    date: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [Tommorowdate, setTommorowDate] = useState();
  const context = useContext(userContext);
  const contract = props.contract;
  const web3Ref = useRef(null); // Sử dụng useRef để lưu trữ web3
  const ethereum = window.ethereum;
  const [account, setacc] = useState([]);

  const { getUser } = context; // Xóa `bookAppointment` nếu không sử dụng

  useEffect(() => {
    async function loadBlockchainData() {
      web3Ref.current = new Web3(ethereum); // Lưu giá trị vào useRef
      let x = await web3Ref.current.eth.getAccounts();
      // const balance = await web3Ref.current.eth.getBalance(x[0]);
      // console.log(
      //   "Số dư tài khoản:",
      //   web3Ref.current.utils.fromWei(balance, "ether"),
      //   "ETH"
      // );
      setacc(x);
    }
    async function getAllDoctors() {
      const resp = await fetch(
        "http://localhost:5000/api/auth/doctor/getalldoctors",
        {
          method: "GET",
        }
      );

      const doctorArray = await resp.json();
      setDoctors(doctorArray);
    }
    async function getAppointmentDetails() {
      if (localStorage.getItem("token")) {
        const user = await getUser(localStorage.getItem("token"));
        if (user._id) {
          details.patientName = user.name;
        } else {
          console.log("Auth token not found");
        }
      }
    }
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    let dd = currentDate.getDate();
    let mm = currentDate.getMonth() + 1;
    let yyyy = currentDate.getFullYear();
    if (dd < 10) {
      dd = "0" + dd;
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    setTommorowDate(`${dd}-${mm}-${yyyy}`);
    loadBlockchainData();
    getAllDoctors();
    getAppointmentDetails();
  }, [details, ethereum, getUser]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (details.slotNo !== "0") {
      details.date = Tommorowdate;

      try {
        const user = await getUser(localStorage.getItem("token"));

        // Gửi giao dịch blockchain
        const result = await contract.methods
          .addToBlockchain(
            user.name,
            doctors[parseInt(details.doctorId) - 1].name,
            parseInt(details.doctorId),
            details.slotNo,
            Tommorowdate
          )
          .send({
            from: account[0],
            gas: 5000000,
            gasPrice: web3Ref.current.utils.toWei("1", "gwei"),
          });

        console.log("Transaction successful:", result);

        // Gọi API backend để lưu lịch hẹn
        const response = await fetch(
          "http://localhost:5000/api/appointment/user/bookappointment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": localStorage.getItem("token"), // Gửi token để xác thực
            },
            body: JSON.stringify({
              patientName: user.name,
              doctorId: parseInt(details.doctorId),
              doctorName: doctors[parseInt(details.doctorId) - 1].name,
              slotNo: details.slotNo,
              date: Tommorowdate,
            }),
          }
        );

        const appointmentData = await response.json();

        if (appointmentData.success) {
          console.log("Appointment saved successfully!");

          // Gọi API backend để lưu transaction hash
          const transactionResponse = await fetch(
            "http://localhost:5000/api/appointment/user/addtransaction",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem("token"), // Gửi token để xác thực
              },
              body: JSON.stringify({
                transaction: result.transactionHash,
              }),
            }
          );

          const transactionData = await transactionResponse.json();

          if (transactionData.success) {
            alert("Appointment and transaction hash saved successfully!");
          } else {
            alert("Failed to save transaction hash in backend.");
          }
        } else {
          alert("Failed to save appointment in backend.");
        }
      } catch (error) {
        console.error("Error during transaction or saving appointment:", error);
        alert("Transaction failed or could not save appointment.");
      }
    } else {
      alert("Choose Slot Number!");
    }
  };

  const onChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <h1>Book an Appointment</h1>
          <br></br>
          <Form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column" }}
            method="POST"
          >
            <Form.Group
              style={{ display: "flex", flexDirection: "row" }}
              className="mb-3"
              controlId="doctor_patient_Details"
            >
              <div style={{ marginRight: "30px" }}>
                <Form.Label>Doctor id</Form.Label>
                <Form.Control
                  onChange={onChange}
                  as="select"
                  placeholder="Select Doctor id"
                  name="doctorId"
                  value={details.doctorId}
                >
                  <option>Choose doctor id</option>
                  {doctors.map((ele, i) => {
                    return (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    );
                  })}
                </Form.Control>
              </div>
              <div style={{ marginRight: "30px" }}>
                <Form.Label>Slot Number</Form.Label>
                <Form.Control
                  onChange={onChange}
                  as="select"
                  placeholder="Select Slot Number"
                  name="slotNo"
                  value={details.slotNo}
                >
                  <option>Choose Slot Number</option>
                  <option key={1} value="1">
                    1
                  </option>
                  <option key={2} value="2">
                    2
                  </option>
                  <option key={3} value="3">
                    3
                  </option>
                  <option key={4} value="4">
                    4
                  </option>
                  <option key={5} value="5">
                    5
                  </option>
                </Form.Control>
              </div>
            </Form.Group>
            <div style={{ marginRight: "30px" }}>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </div>
          </Form>
        </div>
        <div style={{ position: "absolute", left: "700px" }}>
          <h1>Doctor Details</h1>
          <table className="table table-info table-hover table-striped-columns">
            <thead>
              <tr>
                <th scope="col">Doctor ID</th>
                <th scope="col">Doctor Name</th>
                <th scope="col">Specialization</th>
              </tr>
            </thead>
            <tbody className="table-hover">
              {doctors.map((ele, i) => {
                return (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td>{ele.name}</td>
                    <td>{ele.specialization}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
