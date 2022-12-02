window.addEventListener("error", (event) => {
    let textContent = `${event.type}: ${event.message}\n`;
    console.error(textContent);
})
