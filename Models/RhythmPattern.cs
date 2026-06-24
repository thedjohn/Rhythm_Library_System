using System.Collections.Generic;

namespace RhythmLibraryWeb.Models
{
    public class RhythmPattern
    {
        public int Id { get; set; }
        public List<string> Notes { get; set; } = new List<string>();
    }

    public class RhythmGroup
    {
        public string Label  { get; set; }
        public int    Start  { get; set; }
        public int    Length { get; set; }
        public bool   Repeat { get; set; }
    }

    public class ThreeCampsData
    {
        public string Title { get; set; }
        public int    Page  { get; set; }
        public List<RhythmPattern>  RhythmPatterns { get; set; } = new List<RhythmPattern>();
        public List<int>            Rhythm         { get; set; } = new List<int>();
        public List<RhythmGroup>    Groups         { get; set; }
    }
}

