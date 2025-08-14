const API_BASE_URL = "https://asistenteiaconragbackend.onrender.com";

document.addEventListener('DOMContentLoaded', () => {

     function getUsuarioId() {
        return localStorage.getItem("usuario_id");
    }

    const form = document.querySelector('.input-bar');
    const input = form.querySelector('input[type="text"]');
    const thinking = document.querySelector('.thinking');
    const chatBox = document.getElementById('chat-box');
    const conversationList = document.getElementById('conversation-list');
    const newChatBtn = document.querySelector('.sidebar button');

    let chats = {}; // { chatId: { title, conversacionId, messages: [] } }
    let currentChatId = null;
    let chatCount = 0;

    let usuarioId = getUsuarioId();


    // 📌 Cargar conversaciones guardadas desde el backend
    function cargarConversacionesGuardadas() {
        if (!usuarioId) return;

        fetch(`${API_BASE_URL}/conversaciones/${usuarioId}`)
            .then(res => res.json())
            .then(data => {
                conversationList.innerHTML = ""; // 🆕 limpiar lista antes de añadir

                data.forEach(conv => {
                    const chatKey = `chat-${conv.id}`;
                    chats[chatKey] = {
                        title: conv.titulo,
                        conversacionId: conv.id,
                        messages: [] // se llenará al abrirla
                    };

                    const li = document.createElement("li");
                    li.textContent = conv.titulo;
                    li.dataset.chatId = chatKey;
                    li.classList.add("conversation-item");
                    conversationList.appendChild(li);
                });

                // 🆕 Abrir automáticamente la primera conversación si hay
                if (data.length > 0) {
                    const firstChatKey = `chat-${data[0].id}`;
                    setActiveChat(firstChatKey);
                }
            })
            .catch(err => console.error("Error cargando conversaciones:", err));
    }

    // Crear nuevo chat (visual)
    function createNewChat() {
        chatCount++;
        currentChatId = `chat-${chatCount}`;
        chats[currentChatId] = {
            title: `Chat ${chatCount}`,
            conversacionId: null,
            messages: []
        };

        const li = document.createElement("li");
        li.textContent = chats[currentChatId].title;
        li.dataset.chatId = currentChatId;
        li.classList.add("conversation-item");
        conversationList.appendChild(li);

        setActiveChat(currentChatId);
    }

    // Cambiar de chat y mostrar mensajes
    function setActiveChat(chatId) {
        currentChatId = chatId;
        document.querySelectorAll(".conversation-item").forEach(li => li.classList.remove("active"));
        const li = conversationList.querySelector(`[data-chat-id="${chatId}"]`);
        if (li) li.classList.add("active");

        chatBox.innerHTML = "";

        if (chats[chatId].messages.length === 0 && chats[chatId].conversacionId) {
            fetch(`${API_BASE_URL}/mensajes/${chats[chatId].conversacionId}`)
                .then(res => res.json())
                .then(mensajes => {
                    // 🆕 Ajustar según formato de backend
                    chats[chatId].messages = mensajes.map(msg => ({
                        type: msg.remitente === "usuario" ? "user" : "response",
                        text: msg.texto
                    }));
                    chats[chatId].messages.forEach(renderMessage);
                })
                .catch(err => console.error("Error cargando mensajes:", err));
        } else {
            chats[chatId].messages.forEach(renderMessage);
        }
    }

    function renderMessage(msg) {
        if (msg.type === "separator") {
            chatBox.appendChild(document.createElement("hr"));
        } else {
            const p = document.createElement("p");
            if (msg.type === "user") {
                p.style.fontWeight = "bold";
                p.textContent = `Tú: ${msg.text}`;
            } else if (msg.type === "similar") {
                p.style.fontSize = "small";
                p.style.color = "#007700";
                p.textContent = msg.text;
            } else if (msg.type === "response") {
                p.style.fontWeight = "bold";
                p.style.color = "#0000cc";
                p.textContent = msg.text;
            } else if (msg.type === "error") {
                p.style.color = "red";
                p.textContent = msg.text;
            }
            chatBox.appendChild(p);
        }
    }

    let isLoading = false; // 🔹 Estado para saber si está esperando respuesta

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = input.value.trim();
        if (!userMessage || isLoading) return; // ⛔ No envía si está vacío o ya esperando

        isLoading = true; // ⛔ Bloquear nuevos envíos
        input.disabled = true; // 🔹 Bloquear el input
        thinking.textContent = "Pensando...";

        if (!currentChatId) createNewChat();

        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: userMessage,
                    usuario_id: usuarioId,
                    conversacion_id: chats[currentChatId].conversacionId
                })
            });

            const data = await res.json();
            thinking.textContent = "";

            if (!chats[currentChatId].conversacionId) {
                chats[currentChatId].conversacionId = data.conversacion_id;
            }

            chats[currentChatId].messages.push({ type: "separator" });
            chats[currentChatId].messages.push({ type: "user", text: data.mensaje_original });
            renderMessage({ type: "separator" });
            renderMessage({ type: "user", text: data.mensaje_original });

            data.resultados_similares.forEach((sim, index) => {
                const simText = `Similar ${index + 1}: ${sim}`;
                chats[currentChatId].messages.push({ type: "similar", text: simText });
            });

            chats[currentChatId].messages.push({ type: "response", text: `Respuesta: ${data.respuesta_generada}` });
            renderMessage({ type: "response", text: `Respuesta: ${data.respuesta_generada}` });

            chatBox.scrollTop = chatBox.scrollHeight;

        } catch (error) {
            thinking.textContent = "";
            console.error(error);
            chats[currentChatId].messages.push({ type: "error", text: "❌ Error al conectar con el servidor." });
            renderMessage({ type: "error", text: "❌ Error al conectar con el servidor." });
        }

        input.value = "";
        input.disabled = false; // 🔓 Habilitar input otra vez
        isLoading = false; // 🔓 Permitir nuevos envíos
    });
    conversationList.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            setActiveChat(e.target.dataset.chatId);
        }
    });

    newChatBtn.addEventListener("click", () => {
        createNewChat();
    });

    // 📌 Llamar a la carga inicial de conversaciones
    cargarConversacionesGuardadas();
});

document.getElementById("upload-knowledge").addEventListener("click", (event) => {
    event.preventDefault(); // Evita que el form recargue la página

    const fileInput = document.getElementById("knowledge-file");

    // 1. Abrir selector de archivos
    fileInput.click();

    // 2. Cuando se seleccione un archivo
    fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Por favor selecciona un archivo .txt o .csv");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        // 3. Subir al backend
        fetch(`${API_BASE_URL}/upload`, {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            alert("📚 Base de conocimiento subida con éxito");
            console.log("Respuesta backend:", data);
        })
        .catch(err => {
            console.error(err);
            alert("❌ Error al subir archivo");
        });
    };
});

//prueba 