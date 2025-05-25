import React, { useState, useContext, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PharmacistContext from "../../context/pharmscists/pharmacistContext";
import Web3 from "web3";

export const SellMedicine = (props) => {
  const [details, setDetails] = useState({
    doctorId: "0",
    doctorName: "",
    pharmaId: "",
    pharmaName: "",
    patientId: "",
    patientName: "",
    slotNo: "",
    date: "",
    description: "",
  });
  const context = useContext(PharmacistContext);
  const { getPharmacist } = context;
  const contract = props.contract;

  let web3;
  const ethereum = window.ethereum;
  const [account, setacc] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [Todaydate, setTodayDate] = useState();

  useEffect(() => {
    async function loadBlockchainData() {
      if (!window.ethereum) {
        alert("Vui lòng cài đặt MetaMask!");
        return;
      }
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        web3 = new Web3(ethereum);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
          alert("Không tìm thấy tài khoản MetaMask!");
          return;
        }
        setacc(accounts);
      } catch (error) {
        console.error("Lỗi kết nối ví:", error);
        alert("Không thể kết nối ví MetaMask!");
      }
    }

    async function getAllDoctors() {
      try {
        const resp = await fetch(
          "http://localhost:5000/api/auth/doctor/getalldoctors",
          {
            method: "GET",
          }
        );
        if (!resp.ok) throw new Error("Không thể lấy danh sách bác sĩ");
        const doctorArray = await resp.json();
        setDoctors(doctorArray);
      } catch (error) {
        console.error("Lỗi API:", error);
        alert("Không thể tải danh sách bác sĩ!");
      }
    }

    const currentDate = new Date();
    let dd = currentDate.getDate();
    let mm = currentDate.getMonth() + 1;
    let yyyy = currentDate.getFullYear();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    setTodayDate(`${dd}-${mm}-${yyyy}`);

    getAllDoctors();
    loadBlockchainData();
  }, []);

  const onChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      // Tách chuỗi `description` thành mảng hai chiều
      const description = details.description
        .split("\n")
        .map((line) => line.split(",").map((item) => item.trim()))
        .filter((line) => line.length > 0 && line.every((item) => item !== ""));

      // Kiểm tra định dạng của `description`
      if (description.length === 0) {
        alert("Vui lòng nhập mô tả đơn thuốc hợp lệ!");
        return;
      }

      for (let i = 0; i < description.length; i++) {
        if (
          !Array.isArray(description[i]) ||
          description[i].length === 0 ||
          description[i].some((item) => typeof item !== "string" || item === "")
        ) {
          alert("Định dạng mô tả đơn thuốc không hợp lệ!");
          return;
        }
      }

      if (details.doctorId === "0") {
        alert("Vui lòng chọn ID bác sĩ!");
        return;
      }

      if (!details.patientName) {
        alert("Vui lòng nhập tên bệnh nhân!");
        return;
      }

      const pharmacist = await getPharmacist(
        localStorage.getItem("pharmaToken")
      );
      console.log("Pharmacist:", pharmacist);

      if (!pharmacist || !pharmacist._id) {
        alert("Không thể lấy thông tin dược sĩ!");
        return;
      }

      console.log("Description:", JSON.stringify(description, null, 2));

      // Gửi giao dịch blockchain
      const gasEstimate = await contract.methods
        .addReceipt(
          details.patientName,
          parseInt(details.doctorId),
          parseInt(pharmacist._id),
          description,
          Todaydate
        )
        .estimateGas({ from: account[0] });

      await contract.methods
        .addReceipt(
          details.patientName,
          parseInt(details.doctorId),
          parseInt(pharmacist._id),
          description,
          Todaydate
        )
        .send({
          from: account[0],
          gas: Math.floor(gasEstimate * 1.5),
          gasPrice: web3.utils.toWei("20", "gwei"),
        });

      alert("Đơn thuốc đã được thêm thành công!");
    } catch (error) {
      console.error("Lỗi giao dịch:", error);
      let errorMessage = "Không thể thêm đơn thuốc!";
      if (error.message.includes("Invalid description format")) {
        errorMessage =
          "Định dạng mô tả đơn thuốc không hợp lệ. Vui lòng kiểm tra lại!";
      } else if (error.message.includes("out of gas")) {
        errorMessage = "Giao dịch hết gas. Vui lòng thử lại!";
      }
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <h1>Enter Receipt Details</h1>
          <br />
          <Form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Form.Group
              style={{ display: "flex", flexDirection: "row" }}
              className="mb-3"
              controlId="doctor_Details"
            >
              <div style={{ marginRight: "30px" }}>
                <Form.Label>Doctor id</Form.Label>
                <Form.Control
                  onChange={onChange}
                  as="select"
                  name="doctorId"
                  value={details.doctorId}
                >
                  <option value="0">Choose doctor id</option>
                  {doctors.map((ele, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </Form.Control>
              </div>
            </Form.Group>
            <Form.Group
              style={{ display: "flex", flexDirection: "row" }}
              className="mb-3"
              controlId="patient_Details"
            >
              <div style={{ marginRight: "30px" }}>
                <Form.Label>Patient name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Patient name"
                  onChange={onChange}
                  name="patientName"
                  value={details.patientName}
                />
              </div>
            </Form.Group>
            <Form.Group>
              <div style={{ marginRight: "30px" }}>
                <Form.Label>Enter Description</Form.Label>
                <br />
                <textarea
                  style={{ width: "450px", height: "200px" }}
                  placeholder="Thuốc A, 10&#10;Thuốc B, 5"
                  onChange={onChange}
                  name="description"
                  value={details.description}
                />
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
          <br />
          <table className="table table-info table-hover table-striped-columns">
            <thead>
              <tr>
                <th scope="col">Doctor ID</th>
                <th scope="col">Doctor Name</th>
                <th scope="col">Specialization</th>
              </tr>
            </thead>
            <tbody className="table-hover">
              {doctors.map((ele, i) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  <td>{ele.name}</td>
                  <td>{ele.specialization}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
