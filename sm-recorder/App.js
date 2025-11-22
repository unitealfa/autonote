import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const API_BASE = 'https://asr.api.speechmatics.com/v2';
const API_KEY =
  Constants.expoConfig?.extra?.SPEECHMATICS_API_KEY ||
  Constants.manifest?.extra?.SPEECHMATICS_API_KEY;

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const SUMMARIES_DIR  = FileSystem.documentDirectory + 'summaries/';

// ---------- petites utils ----------
async function ensureDir(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}
function extFromUri(uri) {
  const u = (uri || '').toLowerCase();
  if (u.endsWith('.wav')) return 'wav';
  if (u.endsWith('.mp3')) return 'mp3';
  if (u.endsWith('.3gp') || u.endsWith('.3gpp')) return '3gp';
  return 'm4a';
}
function mimeForUri(uri) {
  const e = extFromUri(uri);
  return e === 'wav' ? 'audio/wav' : e === 'mp3' ? 'audio/mpeg' : e === '3gp' ? 'audio/3gpp' : 'audio/m4a';
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- résumé simple (multi-langue) ----------
function summarizeFactory(stopwords) {
  return function summarize(text, max = 10) {
    try {
      const sentences = text
        .replace(/\s+/g, ' ')
        .split(/[.!?…؟۔]+(?:\s+|$)/u)   // pas de lookbehind (compatible Hermes)
        .map(s => s.trim())
        .filter(Boolean);

      if (!sentences.length) return [];

      const tok = s =>
        s.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/[^0-9\u0600-\u06FFa-zA-Z]+/u)
          .filter(w => w && w.length > 2 && !stopwords.has(w));

      const freqs = new Map();
      for (const s of sentences) for (const w of tok(s)) freqs.set(w, (freqs.get(w) || 0) + 1);
      const maxf = Math.max(1, ...freqs.values());

      const scored = sentences.map((s, i) => {
        const words = tok(s);
        let score = 0;
        for (const w of words) score += (freqs.get(w) || 0) / maxf;
        score /= Math.sqrt(Math.max(5, words.length)); // pénalise trop long
        return { i, s, score };
      });

      return scored
        .sort((a,b)=>b.score-a.score)
        .slice(0, max)
        .sort((a,b)=>a.i-b.i)
        .map(x => `• ${x.s}`);
    } catch {
      return ['• Résumé indisponible.'];
    }
  }
}

// ========== Onglet 1 : ENREGISTRER ==========
function RecordScreen({ onTranscribed }) {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState([]);
  const [sound, setSound] = useState(null);

  const stopwords = useMemo(() => new Set([
    // FR
    'alors','au','aussi','avec','avoir','car','ce','cela','ces','dans','de','des','du','elle','en','est','et','ils','je','la','le','les','leur','lui','mais','me','moi','mon','ma','mes','nous','ou','où','par','pas','pour','que','qui','se','ses','son','sont','sur','toi','ton','ta','tes','tout','tous','très','tu','un','une','vous','y','ça',
    // EN
    'the','a','an','and','or','but','of','in','on','at','to','for','from','as','is','are','was','were','be','been','being','i','you','he','she','it','we','they','me','my','your','our','their','this','that','these','those','with','without','by','about',
    // AR (simplifié)
    'و','في','من','على','إلى','عن','مع','ما','لا','نعم','هو','هي','هم','هذا','هذه','كان','كانت','لقد','إن','أن','الى','كما'
  ]), []);
  const summarize = useMemo(() => summarizeFactory(stopwords), [stopwords]);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return Alert.alert('Permission', 'Micro refusé');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setAudioUri(null); setTranscript(''); setSummary([]);
    } catch (e) { console.error('startRecording', e); Alert.alert('Erreur', "Impossible de démarrer l'enregistrement."); }
  }
  async function stopRecording() {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null); setAudioUri(uri);
    } catch (e) { console.error('stopRecording', e); Alert.alert('Erreur', "Impossible d'arrêter l'enregistrement."); }
  }
  async function playRecording() {
    try {
      if (!audioUri) return;
      if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); }
      const { sound: s } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(s);
      await s.playAsync();
    } catch (e) { console.error('play', e); }
  }
  async function saveRecording() {
    try {
      if (!audioUri) return;
      await ensureDir(RECORDINGS_DIR);
      const dest = `${RECORDINGS_DIR}rec-${Date.now()}.${extFromUri(audioUri)}`;
      await FileSystem.copyAsync({ from: audioUri, to: dest });
      Alert.alert('Sauvegardé', 'Vocal enregistré dans la bibliothèque.');
    } catch (e) { console.error('saveRecording', e); Alert.alert('Erreur', "Impossible d'enregistrer le vocal."); }
  }
  async function deleteRecording() {
    try { if (audioUri) await FileSystem.deleteAsync(audioUri, { idempotent: true }); } catch {}
    setAudioUri(null); setTranscript(''); setSummary([]);
  }

  async function transcribeAndSummarizeFromUri(uri) {
    if (!API_KEY) return Alert.alert('Config', 'Ajoute SPEECHMATICS_API_KEY dans app.json → extra puis `npx expo start -c`');
    setIsUploading(true);
    try {
      const name = uri.split('/').pop() || `recording.${extFromUri(uri)}`;
      const form = new FormData();
      form.append('data_file', { uri, name, type: mimeForUri(uri) });
      // Langue auto + préférence FR/EN/AR et tolérance faible confiance
      form.append('config', JSON.stringify({
        type: 'transcription',
        transcription_config: { language: 'auto' },
        language_identification_config: { expected_languages: ['fr','en','ar'], low_confidence_action: 'allow' }
      }));

      const create = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
        body: form,
      });
      if (!create.ok) throw new Error(`Create job ${create.status}: ${await create.text()}`);
      const { id } = await create.json();
      if (!id) throw new Error('Job id manquant');

      let status = 'running', tries = 0;
      while (status === 'running' || status === 'queued') {
        await sleep(2500);
        const r = await fetch(`${API_BASE}/jobs/${id}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
        const j = await r.json();
        status = j.status || j.job?.status || 'running';
        if (++tries > 120) throw new Error('Timeout du job (>5 min).');
      }
      if (status !== 'done') throw new Error(`Job terminé avec statut: ${status}`);

      const t = await fetch(`${API_BASE}/jobs/${id}/transcript?format=txt`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!t.ok) throw new Error(`Transcript ${t.status}: ${await t.text()}`);
      const text = await t.text();
      setTranscript(text);
      setSummary(summarize(text, 10));
      onTranscribed && onTranscribed(summarize(text,10), text);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', e.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🎙️ Enregistrer</Text>
      <View style={styles.row}>
        {!recording ? (
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={startRecording}>
            <Text style={styles.btnText}>▶️ Enregistrer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.stop]} onPress={stopRecording}>
            <Text style={styles.btnText}>⏹️ Stop</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, !audioUri ? styles.disabled : styles.secondary]}
          onPress={playRecording}
          disabled={!audioUri}
        >
          <Text style={styles.btnText}>🎧 Écouter</Text>
        </TouchableOpacity>
      </View>

      {audioUri && (
        <View style={[styles.row, { marginTop: 10 }]}>
          <TouchableOpacity style={styles.smallBtn} onPress={saveRecording}>
            <Text>💾 Garder le vocal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={() => transcribeAndSummarizeFromUri(audioUri)}>
            <Text>⬆️ Transcrire & Résumer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={deleteRecording}>
            <Text>🗑️ Supprimer le vocal</Text>
          </TouchableOpacity>
        </View>
      )}

      {isUploading && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Transcription en cours…</Text>
        </View>
      )}

      {!!summary.length && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Résumé (points clés)</Text>
          {summary.map((b, i) => (<Text key={i} style={styles.bullet}>{b}</Text>))}
        </View>
      )}

      {!!transcript && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transcript (brut)</Text>
          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
            <Text style={{ lineHeight: 20 }}>{transcript}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

// ========== Onglet 2 : VOCAUX ==========
function RecordingsScreen({ onTranscribe }) {
  const [files, setFiles] = useState([]);
  const [sound, setSound] = useState(null);

  async function refresh() {
    await ensureDir(RECORDINGS_DIR);
    const names = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
    const items = await Promise.all(names.map(async n => {
      const p = RECORDINGS_DIR + n;
      const info = await FileSystem.getInfoAsync(p);
      return { name: n, uri: p, mtime: info.modificationTime || 0 };
    }));
    items.sort((a,b)=>b.mtime-a.mtime);
    setFiles(items);
  }

  React.useEffect(()=>{ refresh(); },[]);

  async function play(uri) {
    try {
      if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); }
      const { sound: s } = await Audio.Sound.createAsync({ uri });
      setSound(s); await s.playAsync();
    } catch(e){ console.error(e); }
  }
  async function del(uri) {
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    refresh();
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>📂 Vocaux enregistrés</Text>
      <TouchableOpacity style={styles.smallBtn} onPress={refresh}><Text>🔄 Actualiser</Text></TouchableOpacity>

      {files.map(f => (
        <View key={f.uri} style={styles.listItem}>
          <Text style={{ flex: 1 }}>{f.name}</Text>
          <TouchableOpacity style={styles.tinyBtn} onPress={()=>play(f.uri)}><Text>🎧</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tinyBtn} onPress={()=>onTranscribe(f.uri)}><Text>⬆️</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tinyBtn} onPress={()=>del(f.uri)}><Text>🗑️</Text></TouchableOpacity>
        </View>
      ))}

      {!files.length && <Text style={styles.hint}>Aucun vocal sauvegardé pour l’instant.</Text>}
    </ScrollView>
  );
}

// ========== Onglet 3 : RÉSUMÉS ==========
function SummariesScreen() {
  const [files, setFiles] = useState([]);
  const [opened, setOpened] = useState(null);
  const [content, setContent] = useState('');

  async function refresh() {
    await ensureDir(SUMMARIES_DIR);
    const names = await FileSystem.readDirectoryAsync(SUMMARIES_DIR);
    const items = await Promise.all(names.map(async n => {
      const p = SUMMARIES_DIR + n;
      const info = await FileSystem.getInfoAsync(p);
      return { name: n, uri: p, mtime: info.modificationTime || 0 };
    }));
    items.sort((a,b)=>b.mtime-a.mtime);
    setFiles(items);
  }
  React.useEffect(()=>{ refresh(); },[]);

  async function open(uri){ setOpened(uri); const txt = await FileSystem.readAsStringAsync(uri); setContent(txt); }
  async function del(uri){ try{ await FileSystem.deleteAsync(uri, { idempotent: true }); }catch{} if (opened===uri){ setOpened(null); setContent(''); } refresh(); }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>📝 Résumés</Text>
      <TouchableOpacity style={styles.smallBtn} onPress={refresh}><Text>🔄 Actualiser</Text></TouchableOpacity>

      {files.map(f => (
        <View key={f.uri} style={styles.listItem}>
          <TouchableOpacity style={{ flex: 1 }} onPress={()=>open(f.uri)}><Text>{f.name}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.tinyBtn} onPress={()=>del(f.uri)}><Text>🗑️</Text></TouchableOpacity>
        </View>
      ))}

      {opened && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aperçu</Text>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            <Text style={{ lineHeight: 20 }}>{content}</Text>
          </ScrollView>
        </View>
      )}

      {!files.length && <Text style={styles.hint}>Aucun résumé enregistré pour l’instant.</Text>}
    </ScrollView>
  );
}

// ========== App + Navigation ==========
const Tab = createBottomTabNavigator();
export default function App() {
  async function saveSummaryToFile(bullets, transcript){
    await ensureDir(SUMMARIES_DIR);
    const file = `${SUMMARIES_DIR}note-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(
      file,
      bullets.join('\n') + (transcript ? `\n\n---\nTranscript:\n${transcript}` : '')
    );
    Alert.alert('Sauvegardé', 'Résumé enregistré dans l’onglet Résumés.');
  }

  // utilisé par l’onglet Vocaux pour transcrire un fichier choisi
  async function transcribeFromLibrary(uri){
    try{
      const name = uri.split('/').pop() || `recording.${extFromUri(uri)}`;
      const form = new FormData();
      form.append('data_file', { uri, name, type: mimeForUri(uri) });
      form.append('config', JSON.stringify({
        type: 'transcription',
        transcription_config: { language: 'auto' },
        language_identification_config: { expected_languages: ['fr','en','ar'], low_confidence_action: 'allow' }
      }));
      const create = await fetch(`${API_BASE}/jobs`, { method:'POST', headers:{ Authorization:`Bearer ${API_KEY}`, Accept:'application/json' }, body: form });
      if(!create.ok) throw new Error(`Create job ${create.status}: ${await create.text()}`);
      const { id } = await create.json(); if(!id) throw new Error('Job id manquant');
      let status='running', tries=0;
      while(status==='running'||status==='queued'){
        await sleep(2500);
        const r=await fetch(`${API_BASE}/jobs/${id}`, { headers:{ Authorization:`Bearer ${API_KEY}` }});
        const j=await r.json(); status=j.status||j.job?.status||'running';
        if(++tries>120) throw new Error('Timeout du job (>5 min).');
      }
      if(status!=='done') throw new Error(`Job terminé avec statut: ${status}`);
      const t = await fetch(`${API_BASE}/jobs/${id}/transcript?format=txt`, { headers:{ Authorization:`Bearer ${API_KEY}` }});
      if(!t.ok) throw new Error(`Transcript ${t.status}: ${await t.text()}`);
      const text = await t.text();
      const bullets = summarizeFactory(new Set())(text, 10);
      await saveSummaryToFile(bullets, text);
      Alert.alert('OK', 'Transcription + résumé sauvegardés dans l’onglet Résumés.');
    }catch(e){ console.error(e); Alert.alert('Erreur', e.message); }
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Enregistrer">
          {() => (<RecordScreen onTranscribed={saveSummaryToFile} />)}
        </Tab.Screen>
        <Tab.Screen name="Vocaux">
          {() => (<RecordingsScreen onTranscribe={transcribeFromLibrary} />)}
        </Tab.Screen>
        <Tab.Screen name="Résumés" component={SummariesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#10b981' },
  stop: { backgroundColor: '#ef4444' },
  disabled: { backgroundColor: '#a3a3a3' },
  btnText: { color: 'white', fontWeight: '600' },
  hint: { marginTop: 10, color: '#4b5563' },
  card: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#f3f4f6' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bullet: { marginBottom: 6 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#e5e7eb' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomColor: '#e5e7eb', borderBottomWidth: 1 },
  tinyBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#e5e7eb', borderRadius: 8 },
});
