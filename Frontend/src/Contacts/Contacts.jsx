import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import NavBack from "../NavBack";
import { useTranslation } from "react-i18next"; // Import translation hook

// Update the base URL to match your backend
// const API_BASE_URL = "http://localhost:5000";
const API_BASE_URL = "http://localhost:5000";

function Contacts() {
  const { t } = useTranslation(); // Initialize translation hook
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [user, setUser] = useState(null);

  // Default conversation data
  const defaultConversationData = [
    { "text": t("hello"), "timestamp": "2025-03-20T09:30:00.000000" },
    { "text": t("hi"), "timestamp": "2025-03-20T09:30:15.000000" },
  ];

  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    isEmergency: false,
    photo_url: "",
    conversation_data: defaultConversationData
  });

  const [editContact, setEditContact] = useState({
    name: "",
    email: "",
    phone: "",
    isEmergency: false,
    photo_url: "",
    conversation_data: []
  });

  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [externalNotificationStatus, setExternalNotificationStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUser(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError(t("errorLoadingUserData"));
      }
    } else {
      // Redirect to login if no user found
      navigate("/login");
    }
  }, [navigate, t]);

  useEffect(() => {
    if (user?.user_id) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/contacts/${user.user_id}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${t("serverRespondedWithStatus")}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
      } else {
        setError(t("failedToLoadContacts"));
      }
    } catch (err) {
      setError(t("errorFetchingContacts") + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    const contactToUpdate = isEdit ? editContact : newContact;
    const setContactFunction = isEdit ? setEditContact : setNewContact;

    setContactFunction({
      ...contactToUpdate,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const uploadImageToBackend = async (file) => {
    try {
      setUploadingImage(true);

      // Create form data for the image upload
      const formData = new FormData();
      formData.append("image", file);

      // Upload to our backend, which will handle the ImgBB upload
      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: "POST",
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${t("uploadError")}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.imageUrl;
      } else {
        throw new Error(data.error || t("imageUploadFailed"));
      }
    } catch (err) {
      console.error(t("imageUploadError"), err);
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Create temporary object URL for preview
      const previewUrl = URL.createObjectURL(file);

      if (isEdit) {
        setEditContact({
          ...editContact,
          photo_url: previewUrl,
          file: file
        });
      } else {
        setNewContact({
          ...newContact,
          photo_url: previewUrl,
          file: file
        });
      }
    } catch (err) {
      console.error(t("errorCreatingPreview"), err);
      setError(t("errorCreatingImagePreview"));
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();

    // Validate input
    if (!newContact.name || !newContact.name.trim()) {
      setError(t("contactNameRequired"));
      return;
    }

    // Basic email validation
    if (newContact.email && !validateEmail(newContact.email)) {
      setError(t("enterValidEmail"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      setExternalNotificationStatus(null);

      // Upload the image if provided
      let imageUrl = "";
      if (newContact.file) {
        try {
          imageUrl = await uploadImageToBackend(newContact.file);
          console.log(t("imageUploadedSuccessfully"), imageUrl);
        } catch (uploadError) {
          console.error(t("imageUploadFailed"), uploadError);
          setError(t("failedToUploadImage"));
        }
      }

      // Create contact data
      const contactData = {
        name: newContact.name.trim(),
        email: newContact.email || "",
        phone: newContact.phone || "",
        isEmergency: newContact.isEmergency || false,
        photo_url: imageUrl,
        user_id: user.user_id,
        user_name: user.name || t("unknown"),
        conversation_data: defaultConversationData
      };

      console.log(t("sendingContactDataToBackend"), contactData);

      // First, add to your main contacts API
      const response = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`${t("serverRespondedWithStatus")}: ${response.status}`);
      }

      const data = await response.json();
      console.log(t("backendResponse"), data);

      if (data.success) {
        // Now make the POST request to the /add endpoint (external service)
        try {
          const addResponse = await fetch(`https://slzvr7mc-8000.inc1.devtunnels.ms/add`, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: contactData.name,
              photo_url: contactData.photo_url
            }),
          });

          if (addResponse.ok) {
            const addData = await addResponse.json();
            console.log(t("addEndpointResponse"), addData);
            setExternalNotificationStatus('succeeded');
          } else {
            console.error(t("addEndpointFailed"), addResponse.status);
            setExternalNotificationStatus('failed');
          }
        } catch (addError) {
          console.error(t("errorCallingAddEndpoint"), addError);
          setExternalNotificationStatus('failed');
        }

        // Refresh contacts list
        await fetchContacts();

        // Close modal and reset form
        setShowAddModal(false);
        setNewContact({
          name: "",
          email: "",
          phone: "",
          isEmergency: false,
          photo_url: "",
          conversation_data: defaultConversationData
        });

        // Show notification status for 5 seconds
        setTimeout(() => {
          setExternalNotificationStatus(null);
        }, 5000);

        setError("");

      } else {
        setError(data.error || t("failedToAddContact"));
      }
    } catch (err) {
      console.error(t("errorAddingContact"), err);
      setError(t("errorOccurredAddingContact") + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async (e) => {
    e.preventDefault();

    // Validate input
    if (!editContact.name) {
      setError(t("contactNameRequired"));
      return;
    }

    // Basic email validation
    if (editContact.email && !validateEmail(editContact.email)) {
      setError(t("enterValidEmail"));
      return;
    }

    try {
      setLoading(true);

      // Create a copy of the contact data to update
      const contactData = { ...editContact };

      // Upload the new image if provided
      if (editContact.file) {
        const imageUrl = await uploadImageToBackend(editContact.file);
        contactData.photo_url = imageUrl;
      }

      // Remove file property before sending to backend
      delete contactData.file;

      const response = await fetch(`${API_BASE_URL}/api/contacts/${editContact._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error(`${t("serverRespondedWithStatus")}: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        fetchContacts();
        setShowEditModal(false);
        setError("");
      } else {
        setError(data.error || t("failedToUpdateContact"));
      }
    } catch (err) {
      setError(t("errorOccurredUpdatingContact") + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm(t("confirmDeleteContact"))) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`${t("serverRespondedWithStatus")}: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          fetchContacts();
        } else {
          setError(data.error || t("failedToDeleteContact"));
        }
      } catch (err) {
        setError(t("errorOccurredDeletingContact"));
        console.error(err);
      }
    }
  };

  const handleViewConversation = (contact) => {
    setSelectedContact(contact);
    setShowConversationModal(true);
  };

  const handleEditButtonClick = (contact) => {
    setEditContact({
      ...contact,
    });
    setShowEditModal(true);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (err) {
      console.error(t("errorFormattingTimestamp"), err);
      return timestamp;
    }
  };

  // Framer Motion Variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    whileHover: { scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" },
    whileTap: { scale: 0.98 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.75 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.75, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const buttonHoverTap = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <svg className="animate-spin h-8 w-8 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {t("loadingUserData")}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10">
          <NavBack className="absolute top-4 left-4 z-10 text-white" />

        <motion.div
          className="contacts-container w-full max-w-6xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 relative border border-white/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400/20 to-transparent rounded-tr-full"></div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-8 tracking-wide drop-shadow-lg">
            📞 {t("myContacts")}
          </h1>

          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-700 text-white p-3 rounded-lg text-center mb-6"
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {error}
              </motion.div>
            )}
            {externalNotificationStatus && (
              <motion.div
                className={`p-3 rounded-lg text-center mb-6 ${externalNotificationStatus === 'succeeded' ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}`}
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {t("externalNotification")} {externalNotificationStatus === 'succeeded' ? t("succeeded") : t("failed")}
                {externalNotificationStatus === 'succeeded' && t("contactAddedToExternalService")}
                {externalNotificationStatus === 'failed' && t("failedToNotifyExternalService")}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl mb-8 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 relative overflow-hidden group"
            onClick={() => setShowAddModal(true)}
            {...buttonHoverTap}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative z-10 text-2xl mr-3">➕</span>
            <span className="relative z-10 text-lg">{t("addNewContact")}</span>
          </motion.button>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-400">{t("loadingContacts")}</p>
            </div>
          ) : (
            <div className="contacts-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.length === 0 ? (
                <p className="no-contacts text-center text-lg text-gray-400 col-span-full py-10">{t("noContactsFound")}</p>
              ) : (
                contacts.map((contact) => (
                  <motion.div
                    className="contact-card bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden flex flex-col items-center p-6 relative border border-white/10 hover:border-purple-400/50 transition-all duration-300"
                    key={contact._id}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="whileHover"
                    whileTap="whileTap"
                  >
                    {/* Status indicator bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${contact.isEmergency ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}></div>
                    <div className="contact-photo mb-4 relative">
                      {contact.photo_url ? (
                        <div className="relative">
                          <img src={contact.photo_url} alt={contact.name} className="w-28 h-28 rounded-full object-cover border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg" style={{borderImage: 'linear-gradient(to right, rgb(96, 165, 250), rgb(168, 85, 247)) 1'}} />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-white/20 shadow-lg">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                      {contact.isEmergency && (
                        <motion.span 
                          className="emergency-badge absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ⚠️ {t("emergency")}
                        </motion.span>
                      )}
                    </div>
                    <div className="contact-info text-center flex-grow">
                      <h3 className="text-2xl font-bold text-white mb-3">{contact.name}</h3>
                      {contact.email && (
                        <p className="text-gray-200 text-sm break-all bg-white/10 px-3 py-1.5 rounded-lg mb-2 backdrop-blur-sm">
                          <strong className="text-blue-300">📧</strong> {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-gray-200 text-sm bg-white/10 px-3 py-1.5 rounded-lg mb-2 backdrop-blur-sm">
                          <strong className="text-green-300">📞</strong> {contact.phone}
                        </p>
                      )}
                      {contact.user_name && (
                        <p className="added-by text-gray-300 text-xs mt-3 bg-white/5 px-2 py-1 rounded-full inline-block">
                          👤 {t("addedBy")}: {contact.user_name}
                        </p>
                      )}
                    </div>
                    <div className="contact-actions flex space-x-3 mt-6">
                      <motion.button
                        className="edit-btn p-3 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl text-white transition-all duration-200 shadow-lg border border-yellow-400/30"
                        onClick={() => handleEditButtonClick(contact)}
                        title={t("editContact")}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="text-xl">✏️</span>
                      </motion.button>
                      <motion.button
                        className="view-conversation-btn p-3 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl text-white transition-all duration-200 shadow-lg border border-purple-400/30"
                        onClick={() => handleViewConversation(contact)}
                        title={t("viewConversation")}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="text-xl">💬</span>
                      </motion.button>
                      <motion.button
                        className="delete-btn p-3 bg-gradient-to-br from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white text-xl font-bold transition-all duration-200 shadow-lg border border-red-400/30"
                        onClick={() => handleDeleteContact(contact._id)}
                        title={t("deleteContact")}
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Add Contact Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-purple-500/30 relative overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="modal-header flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    ➕ {t("addNewContact")}
                  </h2>
                  <motion.button
                    className="close-btn text-gray-400 hover:text-white text-3xl leading-none transition-colors"
                    onClick={() => setShowAddModal(false)}
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    &times;
                  </motion.button>
                </div>

                <form onSubmit={handleAddContact}>
                  <div className="form-group mb-4">
                    <label htmlFor="name" className="block text-gray-200 text-sm font-bold mb-2 flex items-center gap-2">
                      <span className="text-blue-400">👤</span> {t("name")} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newContact.name}
                      onChange={(e) => handleInputChange(e, false)}
                      placeholder={t("contactName")}
                      className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl border-2 border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="email" className="block text-gray-200 text-sm font-bold mb-2 flex items-center gap-2">
                      <span className="text-green-400">📧</span> {t("email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newContact.email}
                      onChange={(e) => handleInputChange(e, false)}
                      placeholder={t("emailAddress")}
                      className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl border-2 border-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-200"
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="phone" className="block text-gray-200 text-sm font-bold mb-2 flex items-center gap-2">
                      <span className="text-purple-400">📞</span> {t("phoneNumber")}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={newContact.phone}
                      onChange={(e) => handleInputChange(e, false)}
                      placeholder={t("phoneNumber")}
                      className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl border-2 border-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                    />
                  </div>

                  <div className="form-group checkbox-group mb-4 flex items-center bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                    <input
                      type="checkbox"
                      id="isEmergency"
                      name="isEmergency"
                      checked={newContact.isEmergency}
                      onChange={(e) => handleInputChange(e, false)}
                      className="mr-3 h-5 w-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="isEmergency" className="text-gray-200 text-sm font-bold cursor-pointer flex items-center gap-2">
                      <span className="text-red-400">⚠️</span> {t("emergencyContact")}
                    </label>
                  </div>

                  <div className="form-group mb-6">
                    <label htmlFor="photo" className="block text-gray-200 text-sm font-bold mb-2 flex items-center gap-2">
                      <span className="text-pink-400">📷</span> {t("photo")}
                    </label>
                    <input
                      type="file"
                      id="photo"
                      name="photo"
                      onChange={(e) => handleFileChange(e, false)}
                      accept="image/*"
                      className="w-full text-gray-200 text-sm file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 file:transition-all file:duration-300 file:cursor-pointer"
                    />
                    {newContact.photo_url && (
                      <motion.div 
                        className="preview-photo mt-4 flex justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img src={newContact.photo_url} alt={t("preview")} className="max-w-[120px] max-h-[120px] rounded-full object-cover border-4 border-purple-500 shadow-xl" />
                      </motion.div>
                    )}
                  </div>

                  <div className="form-actions flex justify-end space-x-4 pt-4 border-t border-gray-700">
                    <motion.button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      disabled={uploadingImage}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ❌ {t("cancel")}
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative overflow-hidden group"
                      disabled={uploadingImage || loading}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <span className="relative z-10">
                        {uploadingImage ? (
                          <>💾 {t("uploading")}</>
                        ) : loading ? (
                          <>⏳ {t("addingContact")}</>
                        ) : (
                          <>✨ {t("addContact")}</>
                        )}
                      </span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Contact Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-yellow-500/30 relative overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500"></div>
                <div className="modal-header flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    ✏️ {t("editContact")}
                  </h2>
                  <motion.button
                    className="close-btn text-gray-400 hover:text-white text-3xl leading-none transition-colors"
                    onClick={() => setShowEditModal(false)}
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    &times;
                  </motion.button>
                </div>

                <form onSubmit={handleEditContact}>
                  <div className="form-group mb-4">
                    <label htmlFor="edit-name" className="block text-gray-300 text-sm font-semibold mb-2">{t("name")} *</label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={editContact.name}
                      onChange={(e) => handleInputChange(e, true)}
                      placeholder={t("contactName")}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="edit-email" className="block text-gray-300 text-sm font-semibold mb-2">{t("email")}</label>
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={editContact.email}
                      onChange={(e) => handleInputChange(e, true)}
                      placeholder={t("emailAddress")}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="edit-phone" className="block text-gray-300 text-sm font-semibold mb-2">{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      id="edit-phone"
                      name="phone"
                      value={editContact.phone}
                      onChange={(e) => handleInputChange(e, true)}
                      placeholder={t("phoneNumber")}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="form-group checkbox-group mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isEmergency"
                      name="isEmergency"
                      checked={editContact.isEmergency}
                      onChange={(e) => handleInputChange(e, true)}
                      className="mr-2 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="edit-isEmergency" className="text-gray-300 text-sm font-semibold">{t("emergencyContact")}</label>
                  </div>

                  <div className="form-group mb-6">
                    <label htmlFor="edit-photo" className="block text-gray-300 text-sm font-semibold mb-2">{t("photo")}</label>
                    <input
                      type="file"
                      id="edit-photo"
                      name="photo"
                      onChange={(e) => handleFileChange(e, true)}
                      accept="image/*"
                      className="w-full text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition-all duration-300"
                    />
                    {editContact.photo_url && (
                      <div className="preview-photo mt-4">
                        <img src={editContact.photo_url} alt={t("preview")} className="max-w-[100px] max-h-[100px] rounded-full object-cover mx-auto" />
                      </div>
                    )}
                    <small className="photo-note text-gray-400 text-xs block mt-2">{t("leaveEmptyToKeepCurrentPhoto")}</small>
                  </div>

                  <div className="form-actions flex justify-end space-x-4">
                    <motion.button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      disabled={uploadingImage}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      {...buttonHoverTap}
                    >
                      {t("cancel")}
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploadingImage || loading}
                      {...buttonHoverTap}
                    >
                      {uploadingImage ? t("uploading") : t("saveChanges")}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Modal */}
        <AnimatePresence>
          {showConversationModal && selectedContact && (
            <motion.div
              className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal conversation-modal bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-2xl h-[85vh] flex flex-col border border-purple-500/30 relative overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                <div className="modal-header flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    💬 {t("conversationWith")} {selectedContact.name}
                  </h2>
                  <motion.button
                    className="close-btn text-gray-400 hover:text-white text-3xl leading-none transition-colors"
                    onClick={() => setShowConversationModal(false)}
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    &times;
                  </motion.button>
                </div>

                <div className="conversation-container flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  {selectedContact.conversation_data && selectedContact.conversation_data.length > 0 ? (
                    <div className="conversation-messages space-y-4">
                      {selectedContact.conversation_data.map((message, index) => (
                        <motion.div 
                          key={index} 
                          className="message p-4 rounded-xl bg-gradient-to-br from-purple-700/50 to-indigo-700/50 backdrop-blur-sm text-white shadow-lg border border-purple-500/30"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <div className="message-text text-base leading-relaxed">{message.text}</div>
                          <div className="message-timestamp text-xs text-purple-200 mt-2 text-right flex items-center justify-end gap-1">
                            <span>🕒</span> {formatTimestamp(message.timestamp)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-conversation text-center text-gray-400 py-10">{t("noConversationHistory")}</p>
                  )}
                </div>

                <div className="modal-footer mt-6 pt-4 border-t border-gray-700 flex justify-end">
                  <motion.button
                    className="close-modal-btn px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg relative overflow-hidden group"
                    onClick={() => setShowConversationModal(false)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span className="relative z-10">✔️ {t("close")}</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Contacts;