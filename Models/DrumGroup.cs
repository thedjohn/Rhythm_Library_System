using System.Collections.Generic;

namespace RhythmLibraryWeb.Models
{
    public class DrumNote
    {
        public string Drum   { get; set; }
        public string Limb   { get; set; }    // RH, LH, RF, LF
        public bool   Accent { get; set; }    // true = play/draw louder (~1.5Ã—)
        public bool   Ghost  { get; set; }    // true = very soft hit (~0.25Ã—)
        public int?   Beat   { get; set; }    // notes sharing the same Beat index fire simultaneously; null = sequential
    }

    public class DrumGroup
    {
        public string Name { get; set; }
        public List<DrumNote> Drums { get; set; } = new List<DrumNote>();
    }

    public class GK16Data
    {
        public string Title       { get; set; }
        public bool   Triplet     { get; set; }   // true = triplet subdivision (beatMs/3)
        public bool   ThirtySecond { get; set; }  // true = 32nd-note subdivision (beatMs/8)
        public List<DrumGroup> DrumGroups { get; set; } = new List<DrumGroup>();
    }
}

