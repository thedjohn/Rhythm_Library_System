using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace RhythmLibraryWeb.Services
{
    public class WebAudioService
    {
        private readonly IJSRuntime _js;
        private float _volume = 0.8f;
        private float _clickVolume = 0.8f;

        public WebAudioService(IJSRuntime js) => _js = js;

        public async Task InitializeAsync()
        {
            await _js.InvokeVoidAsync("rhythmAudio.init");
        }

        public async Task PlayDrumSoundAsync(string drumName, float volumeMultiplier = 1.0f)
        {
            await _js.InvokeVoidAsync("rhythmAudio.playDrum", drumName, _volume * volumeMultiplier);
        }

        public async Task PlayClickAsync(bool accent)
        {
            await _js.InvokeVoidAsync("rhythmAudio.playMetronomeBeep", _clickVolume, accent);
        }

        public void SetVolume(float volume) => _volume = volume;
        public void SetClickVolume(float volume) => _clickVolume = volume;

        public async Task StopAsync()
        {
            await _js.InvokeVoidAsync("rhythmAudio.stop");
        }
    }
}
