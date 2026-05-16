import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  const SLOT_INTERVAL_MINUTES = 30;
  const MIN_LEAD_MINUTES = 30;

  function getDefaultBusinessHours(businessId) {
    return daysOfWeek.map((day) => ({
      business_id: businessId,
      day_of_week: day.value,
      open_time: '09:00',
      close_time: day.value === 0 ? '17:00' : '18:00',
      is_closed: day.value === 0,
    }));
  }

  function timeToMinutes(time) {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}`;
  }

  function roundUpToInterval(minutes, interval) {
    return Math.ceil(minutes / interval) * interval;
  }

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const currentPath = window.location.pathname.split('/')[1] || '';
  const isPublicPage = currentPath !== '';

  const [mode, setMode] = useState('login');
  const [session, setSession] = useState(null);
  const [business, setBusiness] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessSlug, setBusinessSlug] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [editingService, setEditingService] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);

  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPublicPage) {
      loadPublicBusiness(currentPath);
    } else {
      checkSession();
    }
  }, []);

  useEffect(() => {
    loadAvailableTimes();
  }, [selectedService, appointmentDate, businessHours]);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setSession(data.session);
      await loadBusiness(data.session.user.id);
    }
  }

  async function loadBusiness(userId) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error cargando negocio:', error);
      setMessage(error.message);
      return;
    }

    setBusiness(data);

    if (data) {
      await loadServices(data.id);
      await loadAppointments(data.id);
      await loadClients(data.id);
      await loadBusinessHours(data.id);
    }
  }

  async function loadPublicBusiness(slug) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error cargando negocio público:', error);
      setMessage(error.message);
      return;
    }

    if (!data) {
      setMessage('Negocio no encontrado.');
      return;
    }

    setBusiness(data);
    await loadServices(data.id);
    await loadBusinessHours(data.id);
  }

  async function loadServices(businessId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando servicios:', error);
      setMessage(error.message);
      return;
    }

    setServices(data || []);
  }

  async function loadAppointments(businessId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          name,
          phone
        ),
        services (
          name,
          price,
          duration_minutes
        )
      `)
      .eq('business_id', businessId)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error cargando citas:', error);
      setMessage(error.message);
      return;
    }

    setAppointments(data || []);
  }

  async function loadClients(businessId) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando clientes:', error);
      setMessage(error.message);
      return;
    }

    setClients(data || []);
  }

  async function loadBusinessHours(businessId) {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error cargando horarios:', error);
      setMessage(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setBusinessHours(getDefaultBusinessHours(businessId));
      return;
    }

    const defaultHours = getDefaultBusinessHours(businessId);

    const mergedHours = defaultHours.map((defaultDay) => {
      const savedDay = data.find(
        (hour) => hour.day_of_week === defaultDay.day_of_week
      );

      return savedDay || defaultDay;
    });

    setBusinessHours(mergedHours);
  }

  function updateBusinessHour(dayOfWeek, field, value) {
    setBusinessHours(
      businessHours.map((hour) =>
        hour.day_of_week === dayOfWeek
          ? { ...hour, [field]: value }
          : hour
      )
    );
  }

  async function handleSaveBusinessHours() {
    setMessage('');
    setLoading(true);

    try {
      if (!business?.id) {
        throw new Error('No hay negocio seleccionado.');
      }

      const rowsToSave = businessHours.map((hour) => ({
        business_id: business.id,
        day_of_week: hour.day_of_week,
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed,
      }));

      const { error } = await supabase
        .from('business_hours')
        .upsert(rowsToSave, {
          onConflict: 'business_id,day_of_week',
        });

      if (error) throw error;

      setMessage('Horario guardado correctamente.');
      await loadBusinessHours(business.id);
    } catch (error) {
      console.error('Error guardando horario:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage('Cuenta creada. Revisá tu correo para confirmar tu email.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSession(data.session);
        await loadBusiness(data.session.user.id);
      }
    } catch (error) {
      console.error('Error auth:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setMessage('Creando negocio...');
    setLoading(true);

    try {
      if (!session?.user?.id) {
        throw new Error('No hay sesión activa.');
      }

      const cleanSlug = businessSlug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const { data, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: session.user.id,
          name: businessName,
          slug: cleanSlug,
          phone: businessPhone,
          address: businessAddress,
        })
        .select()
        .single();

      if (error) throw error;

      setBusiness(data);
      setBusinessHours(getDefaultBusinessHours(data.id));
      setMessage('Negocio creado correctamente.');
    } catch (error) {
      console.error('Error creando negocio:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateService(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!business?.id) {
        throw new Error('No hay negocio seleccionado.');
      }

      const { data, error } = await supabase
        .from('services')
        .insert({
          business_id: business.id,
          name: serviceName,
          price: Number(servicePrice),
          duration_minutes: Number(serviceDuration),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setServices([data, ...services]);
      setServiceName('');
      setServicePrice('');
      setServiceDuration('');
      setMessage('Servicio creado correctamente.');
    } catch (error) {
      console.error('Error creando servicio:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteService(serviceId) {
    const confirmDelete = window.confirm(
      '¿Seguro que querés eliminar este servicio?'
    );

    if (!confirmDelete) return;

    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.filter((service) => service.id !== serviceId));
      setMessage('Servicio eliminado correctamente.');
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditService(service) {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.duration_minutes);
    setMessage('');
  }

  function cancelEditService() {
    setEditingService(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
    setMessage('');
  }

  async function handleUpdateService(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!editingService?.id) {
        throw new Error('No hay servicio seleccionado para editar.');
      }

      const { data, error } = await supabase
        .from('services')
        .update({
          name: serviceName,
          price: Number(servicePrice),
          duration_minutes: Number(serviceDuration),
        })
        .eq('id', editingService.id)
        .select()
        .single();

      if (error) throw error;

      setServices(
        services.map((service) =>
          service.id === editingService.id ? data : service
        )
      );

      setEditingService(null);
      setServiceName('');
      setServicePrice('');
      setServiceDuration('');
      setMessage('Servicio actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableTimes() {
    if (!business?.id || !selectedService || !appointmentDate) {
      setAvailableTimes([]);
      return;
    }

    try {
      const { data: latestHours, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', business.id)
        .order('day_of_week', { ascending: true });

      if (hoursError) throw hoursError;

      const hoursToUse =
        latestHours && latestHours.length > 0
          ? latestHours
          : getDefaultBusinessHours(business.id);

      const selectedDay = new Date(`${appointmentDate}T00:00:00`).getDay();

      const daySchedule = hoursToUse.find(
        (hour) => hour.day_of_week === selectedDay
      );

      if (!daySchedule || daySchedule.is_closed) {
        setAvailableTimes([]);
        setAppointmentTime('');
        return;
      }

      const openMinutes = timeToMinutes(daySchedule.open_time || '09:00');
      const closeMinutes = timeToMinutes(daySchedule.close_time || '18:00');
      const serviceDuration = Number(selectedService.duration_minutes);

      let firstAvailableMinute = openMinutes;

      if (appointmentDate === getTodayDateString()) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        firstAvailableMinute = Math.max(
          openMinutes,
          roundUpToInterval(
            nowMinutes + MIN_LEAD_MINUTES,
            SLOT_INTERVAL_MINUTES
          )
        );
      }

      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)
        .eq('appointment_date', appointmentDate)
        .neq('status', 'cancelled');

      if (error) throw error;

      const slots = [];

      for (
        let start = firstAvailableMinute;
        start + serviceDuration <= closeMinutes;
        start += SLOT_INTERVAL_MINUTES
      ) {
        const end = start + serviceDuration;

        const hasConflict = existingAppointments.some((appointment) => {
          const existingStart = timeToMinutes(appointment.start_time);
          const existingEnd = timeToMinutes(appointment.end_time);

          return start < existingEnd && end > existingStart;
        });

        if (!hasConflict) {
          slots.push(minutesToTime(start));
        }
      }

      setAvailableTimes(slots);

      if (!slots.includes(appointmentTime)) {
        setAppointmentTime('');
      }
    } catch (error) {
      console.error('Error cargando horas disponibles:', error);
      setMessage(error.message);
      setAvailableTimes([]);
    }
  }

  async function handleCreateAppointment(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!business?.id) {
        throw new Error('No se encontró el negocio.');
      }

      if (!selectedService) {
        throw new Error('Seleccioná un servicio.');
      }

      if (!appointmentDate) {
        throw new Error('Seleccioná una fecha.');
      }

      if (!appointmentTime) {
        throw new Error('Seleccioná una hora disponible.');
      }

      const [hours, minutes] = appointmentTime.split(':').map(Number);

      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMinutes(
        endDate.getMinutes() + Number(selectedService.duration_minutes)
      );

      const endTime = endDate.toTimeString().slice(0, 5);

      const appointmentDay = new Date(`${appointmentDate}T00:00:00`).getDay();
      const daySchedule = businessHours.find(
        (hour) => hour.day_of_week === appointmentDay
      );

      if (daySchedule) {
        if (daySchedule.is_closed) {
          throw new Error('Ese día el negocio está cerrado.');
        }

        const openTime = daySchedule.open_time?.slice(0, 5);
        const closeTime = daySchedule.close_time?.slice(0, 5);

        if (openTime && closeTime) {
          if (appointmentTime < openTime || endTime > closeTime) {
            throw new Error(
              `Ese horario está fuera del horario del negocio (${openTime} - ${closeTime}).`
            );
          }
        }
      }

      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business.id)
        .eq('appointment_date', appointmentDate)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      const hasConflict = existingAppointments.some((appointment) => {
        const existingStart = appointment.start_time.slice(0, 5);
        const existingEnd = appointment.end_time.slice(0, 5);

        return appointmentTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        throw new Error('Esa hora ya está ocupada. Elegí otra hora.');
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: business.id,
          name: clientName,
          phone: clientPhone,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      setClients([clientData, ...clients]);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          business_id: business.id,
          service_id: selectedService.id,
          client_id: clientData.id,
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          end_time: endTime,
          status: 'pending',
          total_price: selectedService.price,
        });

      if (appointmentError) throw appointmentError;

      setMessage(
        'Cita reservada correctamente. El negocio confirmará tu cita por WhatsApp.'
      );

      setSelectedService(null);
      setClientName('');
      setClientPhone('');
      setAppointmentDate('');
      setAppointmentTime('');
      setAvailableTimes([]);
    } catch (error) {
      console.error('Error creando cita:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(appointmentId, newStatus) {
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(
        appointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      setMessage('Estado de la cita actualizado.');
    } catch (error) {
      console.error('Error actualizando cita:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAppointment(appointmentId) {
    const confirmDelete = window.confirm(
      '¿Seguro que querés eliminar esta cita?'
    );

    if (!confirmDelete) return;

    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(
        appointments.filter((appointment) => appointment.id !== appointmentId)
      );

      setMessage('Cita eliminada correctamente.');
    } catch (error) {
      console.error('Error eliminando cita:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function getWhatsAppLink(appointment) {
    const phone = appointment.clients?.phone?.replace(/\D/g, '') || '';
    const finalPhone = phone.startsWith('506') ? phone : `506${phone}`;

    const text = `Hola ${appointment.clients?.name || ''}, tu cita para ${
      appointment.services?.name || 'el servicio'
    } el día ${appointment.appointment_date} a las ${appointment.start_time?.slice(
      0,
      5
    )} está registrada.`;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setBusiness(null);
    setServices([]);
    setAppointments([]);
    setClients([]);
    setBusinessHours([]);
    setAvailableTimes([]);
    setMessage('');
  }

  if (isPublicPage) {
    return (
      <div className="page">
        <div className="dashboard-card">
          {business ? (
            <>
              <div className="dashboard-header">
                <div>
                  <h1>{business.name}</h1>
                  <p className="subtitle">{business.address}</p>
                  <p className="subtitle">WhatsApp: {business.phone}</p>
                </div>
              </div>

              <div className="services-section">
                <h2>Servicios disponibles</h2>
                <p className="subtitle-left">
                  Elegí un servicio para reservar tu cita.
                </p>

                <div className="services-list">
                  {services.length === 0 ? (
                    <p className="empty-text">
                      Este negocio todavía no tiene servicios publicados.
                    </p>
                  ) : (
                    services.map((service) => (
                      <div className="service-item" key={service.id}>
                        <div>
                          <h3>{service.name}</h3>
                          <p>{service.duration_minutes} minutos</p>
                        </div>

                        <div>
                          <strong>
                            ₡{Number(service.price).toLocaleString('es-CR')}
                          </strong>
                          <br />
                          <button
                            className="small-button"
                            onClick={() => {
                              setSelectedService(service);
                              setAppointmentDate('');
                              setAppointmentTime('');
                              setAvailableTimes([]);
                              setMessage('');
                            }}
                          >
                            Reservar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedService && (
                  <div className="booking-box">
                    <h2>Reservar: {selectedService.name}</h2>
                    <p className="subtitle-left">
                      Completá tus datos para solicitar la cita.
                    </p>

                    <form onSubmit={handleCreateAppointment}>
                      <label>Tu nombre</label>
                      <input
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />

                      <label>WhatsApp</label>
                      <input
                        type="text"
                        placeholder="Ej: 8888-8888"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                      />

                      <label>Fecha</label>
                      <input
                        type="date"
                        min={getTodayDateString()}
                        value={appointmentDate}
                        onChange={(e) => {
                          setAppointmentDate(e.target.value);
                          setAppointmentTime('');
                        }}
                        required
                      />

                      <label>Hora disponible</label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        required
                        disabled={!appointmentDate || availableTimes.length === 0}
                      >
                        <option value="">
                          {!appointmentDate
                            ? 'Primero elegí una fecha'
                            : availableTimes.length === 0
                              ? 'No hay horarios disponibles'
                              : 'Seleccioná una hora'}
                        </option>

                        {availableTimes.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>

                      <button
                        className="main-button"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Reservando...' : 'Confirmar reserva'}
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setSelectedService(null);
                          setAppointmentDate('');
                          setAppointmentTime('');
                          setAvailableTimes([]);
                          setMessage('');
                        }}
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}

                {message && <p className="message">{message}</p>}
              </div>
            </>
          ) : (
            <div>
              <h1>Agenda Fácil</h1>
              <p className="message">{message || 'Cargando negocio...'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (session && business) {
    return (
      <div className="page">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <h1>{business.name}</h1>
              <p className="subtitle">Panel principal de tu negocio</p>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              Salir
            </button>
          </div>

          <div className="info-box">
            <p>
              <strong>Link público:</strong>
            </p>
            <p>
              {window.location.origin}/{business.slug}
            </p>
          </div>

          <div className="grid">
            <div className="mini-card">
              <h3>Citas</h3>
              <p>{appointments.length} citas registradas.</p>
            </div>

            <div className="mini-card">
              <h3>Clientes</h3>
              <p>{clients.length} clientes registrados.</p>
            </div>
          </div>

          <div className="appointments-section">
            <h2>Citas recientes</h2>
            <p className="subtitle-left">
              Estas son las reservas que han hecho tus clientes.
            </p>

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <p className="empty-text">Todavía no hay citas reservadas.</p>
              ) : (
                appointments.map((appointment) => (
                  <div className="appointment-item" key={appointment.id}>
                    <div>
                      <h3>{appointment.clients?.name || 'Cliente sin nombre'}</h3>
                      <p>
                        WhatsApp:{' '}
                        {appointment.clients?.phone || 'Sin teléfono'}
                      </p>
                      <p>
                        Servicio:{' '}
                        {appointment.services?.name || 'Servicio eliminado'}
                      </p>
                    </div>

                    <div className="appointment-info">
                      <strong>{appointment.appointment_date}</strong>
                      <p>
                        {appointment.start_time?.slice(0, 5)} -{' '}
                        {appointment.end_time?.slice(0, 5)}
                      </p>

                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>

                      <div className="appointment-actions">
                        <a
                          className="action-button whatsapp"
                          href={getWhatsAppLink(appointment)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>

                        {appointment.status !== 'confirmed' && (
                          <button
                            className="action-button confirm"
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                'confirmed'
                              )
                            }
                            disabled={loading}
                          >
                            Confirmar
                          </button>
                        )}

                        {appointment.status !== 'completed' && (
                          <button
                            className="action-button complete"
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                'completed'
                              )
                            }
                            disabled={loading}
                          >
                            Completar
                          </button>
                        )}

                        {appointment.status !== 'cancelled' && (
                          <button
                            className="action-button cancel"
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                'cancelled'
                              )
                            }
                            disabled={loading}
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          className="action-button delete"
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                          disabled={loading}
                        >
                          Eliminar cita
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="clients-section">
            <h2>Clientes</h2>
            <p className="subtitle-left">
              Estos son los clientes que han reservado en tu negocio.
            </p>

            <div className="clients-list">
              {clients.length === 0 ? (
                <p className="empty-text">
                  Todavía no hay clientes registrados.
                </p>
              ) : (
                clients.map((client) => (
                  <div className="client-item" key={client.id}>
                    <div>
                      <h3>{client.name}</h3>
                      <p>WhatsApp: {client.phone}</p>
                    </div>

                    <a
                      className="small-button client-whatsapp"
                      href={`https://wa.me/506${client.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="hours-section">
            <h2>Horario del negocio</h2>
            <p className="subtitle-left">
              Definí los días y horas en que tus clientes pueden reservar.
            </p>

            <div className="hours-list">
              {businessHours.map((hour) => {
                const day = daysOfWeek.find(
                  (dayItem) => dayItem.value === hour.day_of_week
                );

                return (
                  <div className="hour-item" key={hour.day_of_week}>
                    <div className="hour-day">
                      <strong>{day?.label}</strong>
                    </div>

                    <label className="closed-check">
                      <input
                        type="checkbox"
                        checked={hour.is_closed}
                        onChange={(e) =>
                          updateBusinessHour(
                            hour.day_of_week,
                            'is_closed',
                            e.target.checked
                          )
                        }
                      />
                      Cerrado
                    </label>

                    <input
                      type="time"
                      value={hour.open_time?.slice(0, 5) || '09:00'}
                      disabled={hour.is_closed}
                      onChange={(e) =>
                        updateBusinessHour(
                          hour.day_of_week,
                          'open_time',
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="time"
                      value={hour.close_time?.slice(0, 5) || '18:00'}
                      disabled={hour.is_closed}
                      onChange={(e) =>
                        updateBusinessHour(
                          hour.day_of_week,
                          'close_time',
                          e.target.value
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>

            <button
              className="main-button hours-save-button"
              onClick={handleSaveBusinessHours}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar horario'}
            </button>
          </div>

          <div className="services-section">
            <h2>Servicios</h2>
            <p className="subtitle-left">
              Agregá los servicios que tus clientes podrán reservar.
            </p>

            <form
              className="service-form"
              onSubmit={editingService ? handleUpdateService : handleCreateService}
            >
              <input
                type="text"
                placeholder="Nombre del servicio"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Precio"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Duración en minutos"
                value={serviceDuration}
                onChange={(e) => setServiceDuration(e.target.value)}
                required
              />

              <button className="main-button" type="submit" disabled={loading}>
                {loading
                  ? 'Guardando...'
                  : editingService
                    ? 'Guardar cambios'
                    : 'Agregar servicio'}
              </button>

              {editingService && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEditService}
                >
                  Cancelar edición
                </button>
              )}
            </form>

            {message && <p className="message">{message}</p>}

            <div className="services-list">
              {services.length === 0 ? (
                <p className="empty-text">
                  Todavía no tenés servicios creados.
                </p>
              ) : (
                services.map((service) => (
                  <div className="service-item" key={service.id}>
                    <div>
                      <h3>{service.name}</h3>
                      <p>{service.duration_minutes} minutos</p>
                    </div>

                    <div className="service-actions">
                      <strong>
                        ₡{Number(service.price).toLocaleString('es-CR')}
                      </strong>

                      <button
                        className="edit-service-button"
                        onClick={() => startEditService(service)}
                        disabled={loading}
                      >
                        Editar
                      </button>

                      <button
                        className="delete-service-button"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session && !business) {
    return (
      <div className="page">
        <div className="auth-card">
          <h1>Crear negocio</h1>
          <p className="subtitle">
            Este será el perfil público donde tus clientes podrán reservar.
          </p>

          <form onSubmit={handleCreateBusiness}>
            <label>Nombre del negocio</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />

            <label>Link del negocio</label>
            <input
              type="text"
              value={businessSlug}
              onChange={(e) => setBusinessSlug(e.target.value)}
              required
            />

            <label>WhatsApp</label>
            <input
              type="text"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
            />

            <label>Dirección</label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
            />

            <button className="main-button" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear negocio'}
            </button>
          </form>

          <button className="secondary-button" onClick={handleLogout}>
            Cerrar sesión
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="auth-card">
        <h1>Agenda Fácil</h1>
        <p className="subtitle">
          Sistema de reservas para barberías, salones y negocios por cita.
        </p>

        <div className="tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>

          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Registrarme
          </button>
        </div>

        <form onSubmit={handleAuth}>
          <label>Correo</label>
          <input
            type="email"
            placeholder="ejemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="main-button" type="submit" disabled={loading}>
            {loading
              ? 'Cargando...'
              : mode === 'login'
                ? 'Entrar'
                : 'Crear cuenta'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;