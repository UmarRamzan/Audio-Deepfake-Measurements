import { supabase } from "$lib/supabaseClient";
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
    
    const body = await request.json();

    if (body.request == 'createUser') {

        const { data, error } = await supabase.from('User').insert([{ age: body.age, language: body.language },]).select()

        if (error) {
            console.log(error)
        }

        return json({data: data, error: error})

    } else if ( body.request == 'getAudioData' ) {
            
        const { data, error } = await supabase.from('Audio').select('*')

        if (error) {
            console.log(error)
        }

        return json(data)

    } else if ( body.request == 'getAudio' ) {

        const { data, error } = await supabase.storage.from('audio_files').download(body.path)

        if (error) {
            console.log(error)
        }

        return new Response( data, {
            headers: {
                'content-type': 'audio/wav'
            }
        })
    } else if ( body.request == 'saveChoice' ) {
            
            const { data, error } = await supabase.from('Round').insert({
                user_id: body.user_id,
                audio_id: body.audio_id,
                round_num: body.round_num,
                choice: body.choice,
                result: body.result,
                time: body.time

            }).select()

            if (error) {
                console.log(error)
            }
    
            return json({data: data, error: error})
    }


    if (body.request == 'segmentNumbers') {
            const { data, error } = await supabase.from('dataset').select('segment').eq('file', body.fileNumber)

            let segmentNumbers = []
            for (const row of data) {
                segmentNumbers.push(row.segment)
            }

            return json([...new Set(segmentNumbers)].sort((a, b) => a - b))

    } else if (body.request == 'getTranscription') {

        const fileNumber = body.fileNumber
        const segmentNumber = body.segmentNumber

        const { data, error } = await supabase.from('dataset').select('transcription').eq('file', fileNumber).eq('segment', segmentNumber)

        if (data.length == 0) {
            return json('')
        }

        return json(data[0].transcription)

    } else if (body.request == 'saveTranscription') {
        const fileNumber = body.fileNumber
        const segmentNumber = body.segmentNumber
        const transcription = body.transcription

        const { data, error } = await supabase.from('dataset').update({transcription: transcription}).eq('file', fileNumber).eq('segment', segmentNumber)

        return json({data: data, error: error})

    } else if (body.request == 'deleteAudio') {
        const fileNumber = body.fileNumber
        const segmentNumber = body.segmentNumber

        const { data1, error1 } = await supabase.storage.from('audio_segments').remove([fileNumber + '_' + segmentNumber + '.wav'])
        const { data2, error2 } = await supabase.from('dataset').delete().eq('file', fileNumber).eq('segment', segmentNumber)

        return json({data1: data1, error1: error1, data2: data2, error2: error2})
    }
}
