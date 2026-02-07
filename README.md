# 🪑 WebAR Furniture Placer

An immersive, browser-based Augmented Reality (AR) application that allows users to visualize furniture in their own space without downloading a native app. Built using **A-Frame** and the **WebXR Device API**, this project bridges the gap between online shopping and physical reality.



## 🚀 Live Demo
**Check it out here:** [Insert your Netlify/GitHub Pages link here]
*(Note: Requires an AR-capable Android device with Chrome or iOS with WebXR support.)*

## ✨ Key Features
* **App-Free Experience:** No installation required; runs instantly via a web URL.
* **Surface Detection:** Leverages WebXR Hit-Testing to accurately detect floors and horizontal surfaces.
* **Real-time Placement:** Tap to place high-quality GLB furniture models into your environment.
* **Lighting Estimation:** Uses `XREstimatedLight` to match virtual shadows and highlights with your real-world room lighting.
* **Intuitive UI:** A "glassmorphism" inspired interface with a scrollable furniture selection menu and quick-action buttons.
* **Object Management:** Select and delete placed objects to refine your room layout.

## 🛠️ Tech Stack
* **Framework:** [A-Frame](https://aframe.io/) (v1.5.0)
* **Engine:** [Three.js](https://threejs.org/)
* **API:** [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
* **Assets:** Optimized GLB models (Low-poly for mobile performance)
* **Styling:** CSS3 (Backdrop-filter for blur effects)

## 📱 Getting Started

### Prerequisites
1.  **Device:** An ARCore-supported Android device or an ARKit-supported iOS device.
2.  **Browser:** Google Chrome (v79+) or a WebXR-compatible mobile browser.
3.  **Environment:** A well-lit area with textured surfaces (floors/carpets).

### Usage Instructions
1.  Open the live link on your mobile device.
2.  Tap **"Start AR"** and grant camera permissions.
3.  Move your phone slowly to scan the floor until the **blue reticle** appears.
4.  Select a furniture item from the bottom menu.
5.  Tap the screen to place the item on the reticle.
6.  Tap a placed object to select it (highlighted in yellow), and use the **Delete** button to remove it.

## 🔧 Installation (for Developers)
To run this project locally:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/webar-furniture-placer.git](https://github.com/your-username/webar-furniture-placer.git)
    ```
2.  Navigate to the directory:
    ```bash
    cd webar-furniture-placer
    ```
3.  Run a local server (e.g., using VS Code Live Server extension).
4.  **Important:** AR features require an `https` connection. Use **ngrok** or **OpenSSL** to generate a secure tunnel for testing on your mobile device.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
* Models sourced from [Sketchfab](https://sketchfab.com/).
* Powered by the A-Frame community.

A project by Anudeep R Gayakwad and Muthu PriyaNandhini
