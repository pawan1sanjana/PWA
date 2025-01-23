from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import json

app = Flask("ItzSimplyJoe")
app.secret_key = 'superawesomesecretkey1010001'

CUSTOMERS_FILE = "customers.json"

# Utility functions for JSON customer management
def load_customers():
    """Load customer data from the JSON file."""
    try:
        with open(CUSTOMERS_FILE, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def save_customers(customers):
    """Save customer data to the JSON file."""
    with open(CUSTOMERS_FILE, "w") as file:
        json.dump(customers, file, indent=4)

# Routes for customer management system
@app.route("/")
def home():
    return redirect(url_for("success"))

@app.route("/success")
def success():
    return render_template("index.html")

@app.route("/api/customers", methods=["GET", "POST", "PUT"])
def manage_customers():
    customers = load_customers()

    if request.method == "GET":
        return jsonify(customers)

    if request.method == "POST":
        new_customer = request.json
        new_customer["id"] = max(customer["id"] for customer in customers) + 1 if customers else 1
        customers.append(new_customer)
        save_customers(customers)
        return jsonify({"message": "Customer added successfully"}), 201

    if request.method == "PUT":
        updated_customer = request.json
        for customer in customers:
            if customer["id"] == updated_customer["id"]:
                customer.update(updated_customer)
                save_customers(customers)
                return jsonify({"message": "Customer updated successfully"}), 200
        return jsonify({"message": "Customer not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
