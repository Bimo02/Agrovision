import React from "react";
import "./TableRow.css";

function TableRow({ product }) {
  const handleEdit = () => {
    alert(`Editing ${product.name}`);
  };

  const handleDelete = () => {
    alert(`Deleting ${product.name}`);
  };

  return (
    <tr>
      <td>
        <img src={product.image} alt={product.name} />
      </td>
      <td>{product.name}</td>
      <td>{product.category}</td>
      <td>{product.price}</td>
      <td>{product.quantity}</td>
      <td
        className={
          product.status === "Out of Stock" ? "out-of-stock" : "in-stock"
        }
      >
        {product.status}
      </td>
      <td>
        <button className="edit-button" onClick={handleEdit}>
          ✏️
        </button>
        <button className="delete-button" onClick={handleDelete}>
          🗑️
        </button>
      </td>
    </tr>
  );
}

export default TableRow;
