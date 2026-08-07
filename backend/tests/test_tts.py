import pytest
import base64
from unittest import mock
from app import tts, settings

def test_generate_tts_success():
    # We need to mock settings.SARVAM_API_KEY so it doesn't bypass network call
    # Then mock requests.post
    
    mock_wav = b"RIFF____WAVEfmt "
    mock_base64 = base64.b64encode(mock_wav).decode("utf-8")
    
    with mock.patch("app.settings.SARVAM_API_KEY", "test_key"), \
         mock.patch("app.settings.SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech"), \
         mock.patch("requests.post") as mock_post:
         
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"audios": [mock_base64]}
        mock_post.return_value = mock_response
        
        result = tts.generate_tts("Hello", "NEHA", "Tamil")
        
        # Verify result is decoded WAV
        assert result == mock_wav
        
        # Verify requests.post called correctly
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        
        # URL
        assert args[0] == "https://api.sarvam.ai/text-to-speech"
        
        # Headers
        headers = kwargs["headers"]
        assert headers["Content-Type"] == "application/json"
        assert headers["api-subscription-key"] == "test_key"
        
        # Payload format
        payload = kwargs["json"]
        assert payload["text"] == "Hello"
        assert payload["language_code"] == "ta-IN"
        assert payload["speaker"] == "neha" # lowercase
        assert payload["model"] == "bulbul:v3"
        assert "target_language_code" not in payload
        assert "enable_preprocessing" not in payload
        assert "pitch" not in payload
        assert payload["output_audio_codec"] == "wav"

def test_generate_tts_not_wav():
    mock_not_wav = b"NOTRIFF____WAVEfmt "
    mock_base64 = base64.b64encode(mock_not_wav).decode("utf-8")
    
    with mock.patch("app.settings.SARVAM_API_KEY", "test_key"), \
         mock.patch("requests.post") as mock_post:
         
        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"audios": [mock_base64]}
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception, match="TTS failed: Returned audio is not a valid WAV file."):
            tts.generate_tts("Hello", "neha", "English")

def test_generate_tts_404_error_handling():
    with mock.patch("app.settings.SARVAM_API_KEY", "test_key"), \
         mock.patch("requests.post") as mock_post:
         
        mock_response = mock.Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found - your key test_key is invalid"
        mock_post.return_value = mock_response
        
        with pytest.raises(Exception) as excinfo:
            tts.generate_tts("Hello", "neha", "English")
            
        error_msg = str(excinfo.value)
        # Should contain 404
        assert "404" in error_msg
        # Should contain upstream message safe part
        assert "Not Found" in error_msg
        # Should NEVER contain the API key
        assert "test_key" not in error_msg
        assert "***" in error_msg
