using System.Collections.Generic;
using System.Linq;

namespace RhythmLibraryWeb.Models
{
    public class DrumKit
    {
        public string Title          { get; set; }
        public bool   IsTriplet      { get; set; }
        public bool   IsThirtySecond { get; set; }
        public List<DrumGroup> DrumGroups { get; set; } = new List<DrumGroup>();

        public DrumKit(GK16Data gk16Data)
        {
            Title          = gk16Data.Title;
            IsTriplet      = gk16Data.Triplet;
            IsThirtySecond = gk16Data.ThirtySecond;
            DrumGroups     = gk16Data.DrumGroups;
        }
        
        public DrumKit()
        {
        }
        
        public DrumGroup GetDrumGroupByName(string name)
        {
            return DrumGroups.FirstOrDefault(dg => dg.Name == name);
        }
    }
}

