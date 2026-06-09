import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';


function getDefaultBusinessHours(businessId) {
  return [
    { business_id: businessId, day_of_week: 0, open_time: '09:00', close_time: '17:00', is_closed: false },
    { business_id: businessId, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
    { business_id: businessId, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
    { business_id: businessId, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
    { business_id: businessId, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
    { business_id: businessId, day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
    { business_id: businessId, day_of_week: 6, open_time: '09:00', close_time: '17:00', is_closed: false }
  ];
}

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

const [appointmentFilterDate, setAppointmentFilterDate] = useState('');

  function getDayOfWeekFromDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
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

  function copyPublicLink() {
    if (!business?.slug) return;

    const publicLink = `${window.location.origin}/${business.slug}`;
    navigator.clipboard.writeText(publicLink);
    setMessage('Link público copiado.');
  }

  function getFilteredAppointments() {
    let filtered = [...appointments];

    if (appointmentFilterDate) {
      filtered = filtered.filter(
        (appointment) => appointment.appointment_date === appointmentFilterDate
      );
    }

    return filtered.sort((a, b) => {
      const today = getTodayDateString();

      if (a.appointment_date === today && b.appointment_date !== today) return -1;
      if (a.appointment_date !== today && b.appointment_date === today) return 1;

      return `${a.appointment_date} ${a.start_time}`.localeCompare(
        `${b.appointment_date} ${b.start_time}`
      );
    });
  }

  function getTodayIncome() {
    const today = getTodayDateString();

    return appointments
      .filter(
        (appointment) =>
          appointment.appointment_date === today &&
          appointment.status !== 'cancelled'
      )
      .reduce(
        (total, appointment) => total + Number(appointment.total_price || 0),
        0
      );
  }

  function getMonthIncome() {
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = String(today.getFullYear());

    return appointments
      .filter((appointment) => {
        const [year, month] = appointment.appointment_date.split('-');

        return (
          year === currentYear &&
          month === currentMonth &&
          appointment.status !== 'cancelled'
        );
      })
      .reduce(
        (total, appointment) => total + Number(appointment.total_price || 0),
        0
      );
  }

  async function getBusinessScheduleForDate(businessId, dateString) {
    const selectedDay = getDayOfWeekFromDate(dateString);

    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', businessId)
      .eq('day_of_week', selectedDay)
      .maybeSingle();

    if (error) throw error;

    return (
      data ||
      getDefaultBusinessHours(businessId).find(
        (hour) => hour.day_of_week === selectedDay
      )
    );
  }
const currentPath = window.location.pathname.split('/')[1] || '';
const isLandingPage = currentPath === '';
const isAuthPage = currentPath === 'login';
const isPanelPage = currentPath === 'panel';
const isPublicPage =
  currentPath !== '' && currentPath !== 'login' && currentPath !== 'panel';

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

const [businessDescription, setBusinessDescription] = useState('');
const [businessLogoUrl, setBusinessLogoUrl] = useState('');
const [businessPrimaryColor, setBusinessPrimaryColor] = useState('#2563eb');
const [businessType, setBusinessType] = useState('general');
const [themeStyle, setThemeStyle] = useState('style_1');
  useEffect(() => {
    if (isPublicPage) {
      loadPublicBusiness(currentPath);
    } else {
      checkSession();
    }
  }, []);

  useEffect(() => {
    loadAvailableTimes();
  }, [business?.id, selectedService, appointmentDate]);

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
  setBusinessName(data.name || '');
  setBusinessPhone(data.phone || '');
  setBusinessAddress(data.address || '');
  setBusinessDescription(data.description || '');
  setBusinessLogoUrl(data.logo_url || '');
  setBusinessPrimaryColor(data.primary_color || '#2563eb');
  setBusinessType(data.business_type || 'general');
  setThemeStyle(data.theme_style || 'style_1');

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

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
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

  const uniqueClients = [];

  (data || []).forEach((client) => {
    const cleanPhone = normalizePhone(client.phone || '');

    const alreadyExists = uniqueClients.some(
      (savedClient) => normalizePhone(savedClient.phone || '') === cleanPhone
    );

    if (!alreadyExists) {
      uniqueClients.push(client);
    }
  });

  setClients(uniqueClients);
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
        (hour) => Number(hour.day_of_week) === Number(defaultDay.day_of_week)
      );

      return savedDay || defaultDay;
    });

    setBusinessHours(mergedHours);
  }

  function updateBusinessHour(dayOfWeek, field, value) {
    setBusinessHours((currentHours) =>
      currentHours.map((hour) =>
        Number(hour.day_of_week) === Number(dayOfWeek)
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
        day_of_week: Number(hour.day_of_week),
        open_time: hour.open_time ? hour.open_time.slice(0, 5) : '09:00',
        close_time: hour.close_time ? hour.close_time.slice(0, 5) : '18:00',
        is_closed: Boolean(hour.is_closed),
      }));

      const { error: deleteError } = await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', business.id);

      if (deleteError) throw deleteError;

      const { data, error: insertError } = await supabase
        .from('business_hours')
        .insert(rowsToSave)
        .select()
        .order('day_of_week', { ascending: true });

      if (insertError) throw insertError;

      const defaultHours = getDefaultBusinessHours(business.id);

      const mergedHours = defaultHours.map((defaultDay) => {
        const savedDay = data.find(
          (hour) => Number(hour.day_of_week) === Number(defaultDay.day_of_week)
        );

        return savedDay || defaultDay;
      });

      setBusinessHours(mergedHours);
      setMessage('Horario guardado correctamente.');

      if (selectedService && appointmentDate) {
        await loadAvailableTimes();
      }
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
        window.history.pushState({}, '', '/panel');
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
      setAppointmentTime('');
      return;
    }

    try {
      setMessage('');

      const scheduleToUse = await getBusinessScheduleForDate(
        business.id,
        appointmentDate
      );

      if (!scheduleToUse || scheduleToUse.is_closed) {
        setAvailableTimes([]);
        setAppointmentTime('');
        return;
      }

      const openMinutes = timeToMinutes(scheduleToUse.open_time || '09:00');
      const closeMinutes = timeToMinutes(scheduleToUse.close_time || '18:00');
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

const { data: existingAppointments, error: appointmentsError } =
  await supabase.rpc('get_booked_slots', {
    p_business_id: business.id,
    p_appointment_date: appointmentDate,
  });

      if (appointmentsError) throw appointmentsError;

      const slots = [];

      for (
        let start = firstAvailableMinute;
        start + serviceDuration <= closeMinutes;
        start += SLOT_INTERVAL_MINUTES
      ) {
        const end = start + serviceDuration;

        const hasConflict = (existingAppointments || []).some(
          (appointment) => {
            const existingStart = timeToMinutes(appointment.start_time);
            const existingEnd = timeToMinutes(appointment.end_time);

            return start < existingEnd && end > existingStart;
          }
        );

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
      setAppointmentTime('');
    }
  }

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
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

      const scheduleToUse = await getBusinessScheduleForDate(
        business.id,
        appointmentDate
      );

      if (!scheduleToUse || scheduleToUse.is_closed) {
        throw new Error('Ese día el negocio está cerrado.');
      }

      const openTime = scheduleToUse.open_time?.slice(0, 5);
      const closeTime = scheduleToUse.close_time?.slice(0, 5);

      if (openTime && closeTime) {
        if (appointmentTime < openTime || endTime > closeTime) {
          throw new Error(
            `Ese horario está fuera del horario del negocio (${openTime} - ${closeTime}).`
          );
        }
      }

const { data: existingAppointments, error: checkError } =
  await supabase.rpc('get_booked_slots', {
    p_business_id: business.id,
    p_appointment_date: appointmentDate,
  });

      if (checkError) throw checkError;

      const hasConflict = (existingAppointments || []).some((appointment) => {
        const existingStart = appointment.start_time.slice(0, 5);
        const existingEnd = appointment.end_time.slice(0, 5);

        return appointmentTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        throw new Error('Esa hora ya está ocupada. Elegí otra hora.');
      }

      const { error: appointmentError } = await supabase.rpc(
        'create_public_appointment',
        {
          p_business_id: business.id,
          p_service_id: selectedService.id,
          p_client_name: clientName,
          p_client_phone: clientPhone,
          p_appointment_date: appointmentDate,
          p_start_time: appointmentTime,
        }
      );

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

  const clientName = appointment.clients?.name || '';
  const serviceName = appointment.services?.name || 'el servicio';
  const date = appointment.appointment_date;
  const startTime = appointment.start_time?.slice(0, 5);
  const endTime = appointment.end_time?.slice(0, 5);
  const businessName = business?.name || 'nuestro negocio';

  let text = '';

  if (appointment.status === 'pending') {
    text = `Hola ${clientName}, te saludamos de ${businessName}. Tu cita para ${serviceName} el día ${date} de ${startTime} a ${endTime} fue registrada correctamente. En breve te confirmaremos la disponibilidad.`;
  }

  if (appointment.status === 'confirmed') {
    text = `Hola ${clientName}, te confirmamos tu cita en ${businessName}. Servicio: ${serviceName}. Fecha: ${date}. Hora: ${startTime} a ${endTime}. Te esperamos.`;
  }

  if (appointment.status === 'completed') {
    text = `Hola ${clientName}, gracias por visitarnos en ${businessName}. Esperamos que hayas disfrutado tu servicio de ${serviceName}. Será un gusto atenderte nuevamente.`;
  }

  if (appointment.status === 'cancelled') {
    text = `Hola ${clientName}, te informamos que tu cita para ${serviceName} el día ${date} a las ${startTime} fue cancelada. Podés escribirnos para coordinar una nueva fecha.`;
  }

  if (!text) {
    text = `Hola ${clientName}, te contactamos de ${businessName} sobre tu cita para ${serviceName} el día ${date} a las ${startTime}.`;
  }

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
}

async function handleUpdateBusiness(e) {
  e.preventDefault();
  setMessage('');
  setLoading(true);

  try {
    if (!business?.id) {
      throw new Error('No hay negocio seleccionado.');
    }

    const { data, error } = await supabase
      .from('businesses')
.update({
  name: businessName,
  phone: businessPhone,
  address: businessAddress,
  description: businessDescription,
  logo_url: businessLogoUrl,
  primary_color: businessPrimaryColor,
  business_type: businessType,
  theme_style: themeStyle,
})
      .eq('id', business.id)
      .select()
      .single();

    if (error) throw error;

    setBusiness(data);
    setMessage('Configuración del negocio actualizada correctamente.');
  } catch (error) {
    console.error('Error actualizando negocio:', error);
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
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


  if (isLandingPage) {
    return (
      <div className="page landing-page">
        <div className="landing-card">
          <div className="landing-hero">
            <div>
              <span className="landing-badge">Agenda Fácil</span>

              <h1>Reservas online simples para negocios por cita</h1>

              <p className="landing-subtitle">
                Permití que tus clientes reserven desde un link, mientras vos
                gestionás horarios, servicios, citas, clientes e ingresos desde
                un panel privado.
              </p>

              <div className="landing-actions">
                <a className="main-button landing-button" href="/login">
                  Entrar al panel
                </a>

                <a
                  className="secondary-button landing-button"
                  href="https://wa.me/50672314147?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20Agenda%20F%C3%A1cil"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pedir información
                </a>
              </div>
            </div>

            <div className="landing-preview">
              <div className="preview-card">
                <p className="preview-label">Panel privado</p>
                <h3>12 citas registradas</h3>
                <p>Ingresos del mes: ₡185,000</p>
              </div>

              <div className="preview-card">
                <p className="preview-label">Link público</p>
                <h3>Reservar cita</h3>
                <p>Servicios, horarios disponibles y confirmación por WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="landing-section">
            <h2>Ideal para negocios y profesionales que trabajan por cita</h2>

            <div className="landing-grid">
              <div className="landing-feature">
                <h3>Reservas desde un link</h3>
                <p>
                  Compartí tu link por WhatsApp, Instagram o Facebook para que
                  tus clientes puedan reservar.
                </p>
              </div>

              <div className="landing-feature">
                <h3>Panel privado</h3>
                <p>
                  Gestioná citas, clientes, horarios, servicios e ingresos desde
                  un solo lugar.
                </p>
              </div>

              <div className="landing-feature">
                <h3>Horarios inteligentes</h3>
                <p>
                  El sistema muestra solo horas disponibles y evita reservas
                  duplicadas.
                </p>
              </div>

              <div className="landing-feature">
                <h3>WhatsApp integrado</h3>
                <p>
                  Contactá clientes con mensajes listos para confirmar, cancelar
                  o dar seguimiento.
                </p>
              </div>
            </div>
          </div>

          <div className="landing-section">
            <h2>Funciona para muchos tipos de negocio</h2>

            <div className="business-types">
              <span>Barberías</span>
              <span>Salones</span>
              <span>Uñas</span>
              <span>Estética</span>
              <span>Masajes</span>
              <span>Consultorios</span>
              <span>Técnicos</span>
              <span>Entrenadores</span>
              <span>Servicios a domicilio</span>
            </div>
          </div>

          <div className="landing-cta">
            <h2>Empezá a recibir reservas de forma más ordenada</h2>
            <p>
              Agenda Fácil ayuda a negocios pequeños a verse más profesionales y
              ahorrar tiempo gestionando citas.
            </p>

            <a className="main-button landing-button" href="/login">
              Crear mi cuenta
            </a>
          </div>
        </div>
      </div>
    );
  }

  if ((isPanelPage || isAuthPage) && session && business) {
    return (
      <div
  className={`page business-theme theme-${business?.business_type || 'general'}-${business?.theme_style || 'style_1'}`}
  style={{ '--primary-color': business?.primary_color || '#2563eb' }}
>
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

            <p>{window.location.origin}/{business.slug}</p>

            <button className="small-button" onClick={copyPublicLink}>
              Copiar link
            </button>
          </div>

          {message && <p className="message">{message}</p>}

          <div className="grid">
            <div className="mini-card">
              <h3>Citas</h3>
              <p>{appointments.length} citas registradas.</p>
            </div>

            <div className="mini-card">
              <h3>Clientes</h3>
              <p>{clients.length} clientes registrados.</p>
            </div>

            <div className="mini-card">
              <h3>Ingresos hoy</h3>
              <p>₡{getTodayIncome().toLocaleString('es-CR')}</p>
            </div>

            <div className="mini-card">
              <h3>Ingresos del mes</h3>
              <p>₡{getMonthIncome().toLocaleString('es-CR')}</p>
            </div>
          </div>

          <div className="appointments-section">
            <h2>Citas recientes</h2>
            <p className="subtitle-left">
              Estas son las reservas que han hecho tus clientes.
            </p>

            <div className="filter-box">
              <label>Filtrar citas por fecha</label>

              <input
                type="date"
                value={appointmentFilterDate}
                onChange={(e) => setAppointmentFilterDate(e.target.value)}
              />

              {appointmentFilterDate && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setAppointmentFilterDate('')}
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className="appointments-list">
              {getFilteredAppointments().length === 0 ? (
                <p className="empty-text">Todavía no hay citas reservadas.</p>
              ) : (
                getFilteredAppointments().map((appointment) => (
                  <div className="appointment-item" key={appointment.id}>
                    <div>
                      <h3>
                        {appointment.clients?.name || 'Cliente sin nombre'}
                      </h3>
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

                        {appointment.status === 'pending' && (
                          <>
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
                          </>
                        )}

                        {appointment.status === 'confirmed' && (
                          <>
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
                          </>
                        )}

                        {appointment.status === 'completed' && (
                          <span className="appointment-final-text">
                            Cita completada
                          </span>
                        )}

                        {appointment.status === 'cancelled' && (
                          <span className="appointment-final-text">
                            Cita cancelada
                          </span>
                        )}
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

          <div className="business-settings-section">
            <h2>Configuración del negocio</h2>
            <p className="subtitle-left">
              Personalizá la información que verán tus clientes.
            </p>

            <form className="business-settings-form" onSubmit={handleUpdateBusiness}>
              <label>Nombre del negocio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
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

              <label>Descripción</label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Ej: Servicio profesional por cita."
                rows="3"
              />

              <label>Logo URL</label>
              <input
                type="text"
                value={businessLogoUrl}
                onChange={(e) => setBusinessLogoUrl(e.target.value)}
                placeholder="https://..."
              />

              <label>Color principal</label>
              <input
                type="color"
                value={businessPrimaryColor}
                onChange={(e) => setBusinessPrimaryColor(e.target.value)}
              />
              <label>Tipo de negocio</label>
<select
  value={businessType}
  onChange={(e) => setBusinessType(e.target.value)}
>
  <option value="general">General</option>
  <option value="barberia">Barbería</option>
  <option value="unas">Uñas</option>
  <option value="estetica">Estética</option>
  <option value="masajes">Masajes</option>
  <option value="consultorio">Consultorio</option>
  <option value="grooming">Grooming canino</option>
  <option value="entrenador">Entrenador</option>
  <option value="domicilio">Servicios a domicilio</option>
</select>

<label>Estilo visual</label>
<select
  value={themeStyle}
  onChange={(e) => setThemeStyle(e.target.value)}
>
  <option value="style_1">Estilo 1</option>
  <option value="style_2">Estilo 2</option>
  <option value="style_3">Estilo 3</option>
</select>

              <button className="main-button" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </form>
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
              onSubmit={
                editingService ? handleUpdateService : handleCreateService
              }
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

  if ((isPanelPage || isAuthPage) && session && !business) {
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

  if (isAuthPage || isPanelPage) {
    return (
      <div className="page">
        <div className="auth-card">
          <h1>Agenda Fácil</h1>
          <p className="subtitle">
            Reservas online simples para negocios, profesionales y servicios por cita.
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

  if (isPublicPage) {
    return (
      <div
  className={`page business-theme theme-${business.business_type || 'general'}-${business.theme_style || 'style_1'}`}
  style={{ '--primary-color': business.primary_color || '#2563eb' }}
      
      >
        <div className="dashboard-card">
          {business ? (
            <>
              <div className="dashboard-header">
                <div>
                  {business.logo_url && (
                    <img
                      className="business-logo"
                      src={business.logo_url}
                      alt={`Logo de ${business.name}`}
                    />
                  )}

                  <h1>{business.name}</h1>

                  {business.description && (
                    <p className="subtitle">{business.description}</p>
                  )}

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

  return (
    <div className="page">
      <div className="auth-card">
        <h1>Ruta no encontrada</h1>
        <p className="subtitle">
          La página que buscás no existe o el link está mal escrito.
        </p>

        <a className="main-button" href="/">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

export default App;